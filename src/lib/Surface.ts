import { Map } from 'immutable';
import * as THREE from 'three';
import { Camera } from './Camera';
import { EventType } from './Event';
import { processEvents } from './eventProcessor';
import {
  extractSourceCodeFromSnowportId,
  getSourceCode,
  takeSnowportId,
} from './logicClock';
import { smoothPosition, smoothSteps } from './utils';
import type { DragEvent, Event, GrabEvent } from './Event';
import type { vector2 } from './utils';

const material = new THREE.MeshBasicMaterial({ color: 0xffffff });

interface RemoteDrag {
  componentId: number;
  startPosition: vector2;
  targetPosition: vector2;
  startTime: number;
  duration: number; // milliseconds
}

export class Surface {
  readonly camera: Camera;

  readonly events: Map<number, Event>;
  readonly ephemeralDrags: Map<
    number,
    { componentId: number; x: number; y: number }
  >;
  readonly remoteDrags: Map<number, RemoteDrag>;

  readonly meshes: Map<number, THREE.Mesh>;
  private readonly threeScene: THREE.Scene;
  private readonly threeCamera: THREE.Camera;

  private constructor(
    camera: Camera,
    events: Map<number, Event>,
    ephemeralDrags: Map<number, { componentId: number; x: number; y: number }>,
    remoteDrags: Map<number, RemoteDrag>,
    meshes: Map<number, THREE.Mesh>,
    threeScene: THREE.Scene,
    threeCamera: THREE.Camera,
  ) {
    this.camera = camera;

    this.events = events;
    this.ephemeralDrags = ephemeralDrags;
    this.remoteDrags = remoteDrags;

    this.meshes = meshes;
    this.threeScene = threeScene;
    this.threeCamera = threeCamera;
  }

  static create(): Surface {
    const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0, 200);
    camera.position.z = 100;
    return new Surface(
      new Camera(),
      Map<number, Event>(),
      Map<number, { componentId: number; x: number; y: number }>(),
      Map<number, RemoteDrag>(),
      Map<number, THREE.Mesh>(),
      new THREE.Scene(),
      camera,
    );
  }

  setCamera(camera: Camera): Surface {
    return new Surface(
      camera,
      this.events,
      this.ephemeralDrags,
      this.remoteDrags,
      this.meshes,
      this.threeScene,
      this.threeCamera,
    );
  }

  updateCamera(fn: (camera: Camera) => Camera): Surface {
    return this.setCamera(fn(this.camera));
  }

  setEvents(events: Map<number, Event>) {
    // Check for new remote drag events
    const localSourceCode = getSourceCode();
    const components = processEvents(this.events);
    let nextRemoteDrags = this.remoteDrags;

    for (const [snowportId, event] of events.entries()) {
      if (!this.events.has(snowportId) && event.type === EventType.Drag) {
        const eventSourceCode = extractSourceCodeFromSnowportId(
          event.snowportId,
        );
        if (eventSourceCode !== localSourceCode) {
          // This is a remote drag event
          const component = components.get(event.componentId);
          if (component) {
            nextRemoteDrags = nextRemoteDrags.set(event.componentId, {
              componentId: event.componentId,
              startPosition: [component.x, component.y],
              targetPosition: [event.x, event.y],
              startTime: performance.now(),
              duration: smoothSteps,
            });
          }
        }
      }
    }

    return new Surface(
      this.camera,
      events,
      this.ephemeralDrags,
      nextRemoteDrags,
      this.meshes,
      this.threeScene,
      this.threeCamera,
    );
  }

  private addEvent(event: Event): Surface {
    return new Surface(
      this.camera,
      this.events.set(event.snowportId, event),
      this.ephemeralDrags,
      this.remoteDrags,
      this.meshes,
      this.threeScene,
      this.threeCamera,
    );
  }

  grab(
    id: number,
    x: number,
    y: number,
    width: number,
    height: number,
  ): Surface {
    const components = processEvents(this.events);
    let result = null;
    const [xWorld, yWorld] = this.camera.getWorldPosition(x, y, width, height);
    for (const [, component] of components) {
      const halfWidth = component.width / 2;
      const halfHeight = component.height / 2;
      if (
        xWorld >= component.x - halfWidth &&
        xWorld <= component.x + halfWidth &&
        yWorld >= component.y - halfHeight &&
        yWorld <= component.y + halfHeight
      ) {
        if (result === null || component.z > result.z) {
          result = component;
        }
      }
    }
    if (result !== null) {
      return this.addEvent({
        entity: 0,
        type: EventType.Grab,
        snowportId: takeSnowportId(),
        pointerId: id,
        componentId: result.id,
        x: Math.round(xWorld - result.x),
        y: Math.round(yWorld - result.y),
      } as GrabEvent);
    } else {
      return this.setCamera(this.camera.addPointer(id, x, y, width, height));
    }
  }

  drag(
    id: number,
    x: number,
    y: number,
    width: number,
    height: number,
  ): Surface {
    const components = processEvents(this.events);
    const component = components.find((c) => c.grab?.pointerId === id);
    if (component?.grab) {
      const [xWorld, yWorld] = this.camera.getWorldPosition(
        x,
        y,
        width,
        height,
      );
      // Update ephemeral state instead of creating event
      return new Surface(
        this.camera,
        this.events,
        this.ephemeralDrags.set(id, {
          componentId: component.id,
          x: Math.round(xWorld - component.grab.offsetX),
          y: Math.round(yWorld - component.grab.offsetY),
        }),
        this.remoteDrags,
        this.meshes,
        this.threeScene,
        this.threeCamera,
      );
    } else {
      return this.setCamera(this.camera.updatePointer(id, x, y, width, height));
    }
  }

  commitDrag(id: number): Surface {
    const ephemeralDrag = this.ephemeralDrags.get(id);
    if (!ephemeralDrag) {
      return this;
    }

    // Create permanent drag event from ephemeral state
    const dragEvent: DragEvent = {
      entity: 0,
      type: EventType.Drag,
      snowportId: takeSnowportId(),
      pointerId: id,
      componentId: ephemeralDrag.componentId,
      x: ephemeralDrag.x,
      y: ephemeralDrag.y,
    };

    // Add event and keep ephemeral drag (for continued dragging)
    return new Surface(
      this.camera,
      this.events.set(dragEvent.snowportId, dragEvent),
      this.ephemeralDrags,
      this.remoteDrags,
      this.meshes,
      this.threeScene,
      this.threeCamera,
    );
  }

  drop(id: number): Surface {
    const components = processEvents(this.events);
    const component = components.find((c) => c.grab?.pointerId === id);
    if (component?.grab) {
      const snowportId = takeSnowportId();
      // Create drop event and clear ephemeral drag
      return new Surface(
        this.camera,
        this.events.set(snowportId, {
          entity: 0,
          type: EventType.Drop,
          snowportId,
          pointerId: id,
          componentId: component.id,
        }),
        this.ephemeralDrags.delete(id), // Clear ephemeral state
        this.remoteDrags,
        this.meshes,
        this.threeScene,
        this.threeCamera,
      );
    } else {
      return this.setCamera(this.camera.removePointer(id));
    }
  }

  render(renderer: THREE.WebGLRenderer): Surface {
    const [width, height] = renderer.getSize(new THREE.Vector2());
    this.camera.apply(this.threeCamera, width, height);

    const components = processEvents(this.events);

    const meshes = this.meshes.asMutable();
    const now = performance.now();
    let nextRemoteDrags = this.remoteDrags;

    for (const [id, component] of components) {
      // Check if there's an ephemeral drag for this component (local drag)
      const ephemeralDrag = Array.from(this.ephemeralDrags.values()).find(
        (drag) => drag.componentId === id,
      );

      let displayX = component.x;
      let displayY = component.y;

      if (ephemeralDrag) {
        // Local drag takes priority
        displayX = ephemeralDrag.x;
        displayY = ephemeralDrag.y;
      } else {
        // Check for remote drag
        const remoteDrag = this.remoteDrags.get(id);
        if (remoteDrag) {
          const elapsed = now - remoteDrag.startTime;
          const t = Math.min(elapsed / remoteDrag.duration, 1.0);

          if (t >= 1.0) {
            // Animation complete, use target position and remove from remoteDrags
            displayX = remoteDrag.targetPosition[0];
            displayY = remoteDrag.targetPosition[1];
            nextRemoteDrags = nextRemoteDrags.delete(id);
          } else {
            // Interpolate using smoothPosition
            const [smoothX, smoothY] = smoothPosition(
              t,
              remoteDrag.startPosition,
              remoteDrag.targetPosition,
            );
            displayX = smoothX;
            displayY = smoothY;
          }
        }
      }

      if (meshes.has(id)) {
        const mesh = this.meshes.get(component.id);
        if (mesh) {
          mesh.position.set(displayX, displayY, component.z);
        }
      } else {
        const geometry = new THREE.BoxGeometry(
          component.width,
          component.height,
          0.02,
        );

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(displayX, displayY, component.z);
        this.threeScene.add(mesh);
        meshes.set(component.id, mesh);
      }
    }

    renderer.render(this.threeScene, this.threeCamera);

    return new Surface(
      this.camera,
      this.events,
      this.ephemeralDrags,
      nextRemoteDrags,
      meshes.asImmutable(),
      this.threeScene,
      this.threeCamera,
    );
  }
}
