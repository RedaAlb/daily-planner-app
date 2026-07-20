import React from "react";
import { List, Box, Fab } from "@mui/material";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import AddIcon from "@mui/icons-material/Add";

import BodyPartItem from "./workout/BodyPartItem";
import useWorkouts from "../hooks/useWorkouts";

const WorkoutTracker = () => {
  const {
    bodyParts,
    handleDragEnd,
    addBodyPart,
    deleteBodyPart,
    addExercise,
    deleteExercise,
    addWeight,
    deleteWeight,
    handleBodyPartNameChange,
    handleExerciseNameChange,
    handleWeightChange,
    handleExerciseDragEnd
  } = useWorkouts();

  return (
    <Box>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="body-parts">
          {(provided) => (
            <List {...provided.droppableProps} ref={provided.innerRef} sx={{p: 0}}>
              {bodyParts.map((bodyPart, index) => (
                <Draggable key={`bp-${bodyPart.id}`} draggableId={`bodypart-${bodyPart.id}`} index={index}>
                  {(provided) => (
                    <BodyPartItem
                      bodyPart={bodyPart}
                      provided={provided}
                      onDelete={deleteBodyPart}
                      onAddExercise={addExercise}
                      onDeleteExercise={deleteExercise}
                      onAddWeight={addWeight}
                      onDeleteWeight={deleteWeight}
                      onBodyPartNameChange={handleBodyPartNameChange}
                      onExerciseNameChange={handleExerciseNameChange}
                      onWeightChange={handleWeightChange}
                      onExerciseDragEnd={handleExerciseDragEnd}
                    />
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </List>
          )}
        </Droppable>
      </DragDropContext>

      <Fab
        onClick={addBodyPart}
        color="primary"
        size="large"
        sx={{ position: "fixed", bottom: 26, right: 26 }}
      >
        <AddIcon fontSize="medium" />
      </Fab>
    </Box>
  );
};

export default WorkoutTracker;