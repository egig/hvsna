import {
  DndContext,
  DragOverlay,
  MouseSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useState } from "react";
import { createPortal } from "react-dom";

export default function DroppableContext({
  children,
}: {
  children: React.ReactNode;
}) {
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10,
    },
  });
  const sensors = useSensors(mouseSensor);
  const [dragOverlayData, setDragOverlayData] = useState(null);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionAlgorithm}
      onDragStart={() => {
        setDragOverlayData(null);
      }}
      onDragEnd={() => {
        // handleDrop(e, dt);
      }}
    >
      {children}
      {createPortal(
        <DragOverlay>
          {!!dragOverlayData && <p>{dragOverlayData}</p>}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  );
}

function handleDrop() {
  //..
}

function collisionDetectionAlgorithm(args: any) {
  const pointerCollisions = pointerWithin(args);
  // Collision detection algorithms return an array of collisions
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  // If there are no collisions with the pointer, return rectangle intersections
  return rectIntersection(args);
}
