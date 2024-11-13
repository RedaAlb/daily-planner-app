import React, { useState, useCallback, memo, useEffect } from "react";
import { 
  List, 
  ListItem, 
  IconButton, 
  Box, 
  TextField, 
  Collapse, 
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Fab
} from "@mui/material";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CloseIcon from "@mui/icons-material/Close";
import { ref, set, remove, onValue, off, update } from "firebase/database";
import { appDb } from "../utils/Firebase";

const generateUniqueId = (prefix) => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const DeleteConfirmationDialog = ({ open, onClose, onConfirm, itemType, itemName }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Confirm Delete</DialogTitle>
    <DialogContent>
      <Typography>
        Delete {itemType}
        {itemName ? `: "${itemName}"` : ""}?
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onConfirm} color="error">Delete</Button>
    </DialogActions>
  </Dialog>
);

const WeightEntry = memo(({ weight, onDelete, onWeightChange }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", borderBottom: "1px solid #e0e0e0"}}>
        <TextField disabled
          size="small"
          value={weight.timestamp}
          sx={{width: "200px", border: "none", "& input": { textAlign: "center", padding: 1}}}
          variant="standard"
          InputProps={{ disableUnderline: true}}
        />
        <TextField
          size="small"
          type="number"
          value={weight.value}
          onChange={(e) => onWeightChange(weight.id, e.target.value)}
          placeholder="Weight"
          sx={{ width: "120px", mr: 2, "& input": { textAlign: "center" }}}
          variant="standard"
          InputProps={{ disableUnderline: true}}
        />
        kg

        <Box sx={{ flexGrow: 1 }}/>

        <IconButton onClick={() => setDeleteDialogOpen(true)} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          onDelete(weight.id);
          setDeleteDialogOpen(false);
        }}
        itemType="weight"
        itemName={`${weight.timestamp} ${weight.value} kg`}
      />
    </>
  );
});

const ExerciseItem = memo(({
  exercise,
  bodyPartId,
  provided,
  onDelete,
  onAddWeight,
  onDeleteWeight,
  onExerciseNameChange,
  onWeightChange,
  forceExpanded
}) => {
  const [expanded, setExpanded] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (forceExpanded) {
      setExpanded(true);
    }
  }, [forceExpanded]);

  return (
    <>
      <ListItem
        ref={provided.innerRef}
        {...provided.draggableProps}
        sx={{ display: "flex", flexDirection: "column", pb: 0, pt: 0, pl: 3, pr: 1, backgroundColor: "#f5f5f5"}}
      >
        <Box sx={{ display: "flex", width: "100%", alignItems: "center" }}>
          <Box {...provided.dragHandleProps} sx={{ mr: 1 }}>
            <DragHandleIcon />
          </Box>
          <TextField
            value={exercise.name}
            onChange={(e) => onExerciseNameChange(bodyPartId, exercise.id, e.target.value)}
            variant="standard"
            fullWidth
            sx={{ mr: 2, "& input": { fontSize: 18 }, pb: "4px", pt: "4px"}}
            InputProps={{ disableUnderline: true}}
            placeholder="Exercise"
          />
          <IconButton onClick={() => setExpanded(!expanded)} size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
          <IconButton 
            onClick={() => {
              onAddWeight(bodyPartId, exercise.id);
              setExpanded(true);
            }} 
            size="small"
          >
            <AddIcon />
          </IconButton>
          <IconButton onClick={() => setDeleteDialogOpen(true)} size="small">
            <DeleteIcon />
          </IconButton>
        </Box>

        <Collapse in={expanded} sx={{ width: "100%" }}>
          <Paper elevation={0} sx={{ mt: 0, backgroundColor: "transparent" }}>
            {exercise.weights?.map((weight) => (
              <WeightEntry
                key={`wt-${weight.id}`}
                weight={weight}
                onDelete={(weightId) => onDeleteWeight(bodyPartId, exercise.id, weightId)}
                onWeightChange={(weightId, value) => onWeightChange(bodyPartId, exercise.id, weightId, value)}
              />
            ))}
          </Paper>
        </Collapse>
      </ListItem>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          onDelete(bodyPartId, exercise.id);
          setDeleteDialogOpen(false);
        }}
        itemType="exercise"
        itemName={exercise.name}
      />
    </>
  );
});

const BodyPartItem = memo(({
  bodyPart,
  provided,
  onDelete,
  onAddExercise,
  onDeleteExercise,
  onAddWeight,
  onDeleteWeight,
  onBodyPartNameChange,
  onExerciseNameChange,
  onWeightChange
}) => {
  const [expanded, setExpanded] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lastAddedExerciseId, setLastAddedExerciseId] = useState(null);

  const handleAddExercise = useCallback(() => {
    setExpanded(true);
    onAddExercise(bodyPart.id).then((newExerciseId) => {
      setLastAddedExerciseId(newExerciseId);
    });
  }, [bodyPart.id, onAddExercise]);

  const handleExerciseDragEnd = async (result) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    const exercises = Array.from(bodyPart.exercises || []);
    const [removed] = exercises.splice(sourceIndex, 1);
    exercises.splice(destinationIndex, 0, removed);

    const updates = {};
    exercises.forEach((exercise, index) => {
      updates[`workouts/${bodyPart.id}/exercises/${exercise.id}/order`] = index;
    });

    await update(ref(appDb), updates);
  };

  return (
    <>
      <ListItem
        ref={provided.innerRef}
        {...provided.draggableProps}
        sx={{ display: "flex", flexDirection: "column", borderBottom: "1px solid #e0e0e0", p: 0, pl: 0, pr: 0}}
      >
        <Box sx={{ display: "flex", width: "100%", alignItems: "center", pb: 1, pt: 1}}>
          <Box {...provided.dragHandleProps} sx={{ pl: 1, pr: 1}}>
            <DragHandleIcon />
          </Box>
          <TextField
            value={bodyPart.name}
            onChange={(e) => onBodyPartNameChange(bodyPart.id, e.target.value)}
            variant="standard"
            fullWidth
            placeholder="Body part"
            sx={{ mr: 2, "& input": { fontSize: 20, fontWeight: 600 }}}
            InputProps={{ disableUnderline: true}}
          />
          <IconButton onClick={() => setExpanded(!expanded)} size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
          <IconButton onClick={handleAddExercise} size="small">
            <AddIcon />
          </IconButton>
          <IconButton onClick={() => setDeleteDialogOpen(true)} size="small" sx={{pr: 1}}>
            <DeleteIcon />
          </IconButton>
        </Box>

        <Collapse in={expanded} sx={{ width: "100%", backgroundColor: "#f5f5f5"}}>
          <DragDropContext onDragEnd={handleExerciseDragEnd}>
            <Droppable droppableId={`exercises-${bodyPart.id}`}>
              {(provided) => (
                <List {...provided.droppableProps} ref={provided.innerRef} sx={{p: 0, backgroundColor: "#f5f5f5"}} >
                  {(bodyPart.exercises || []).map((exercise, index) => (
                    <Draggable key={`ex-${exercise.id}`} draggableId={`exercise-${exercise.id}`} index={index}>
                      {(provided) => (
                        <ExerciseItem
                          exercise={exercise}
                          bodyPartId={bodyPart.id}
                          provided={provided}
                          onDelete={onDeleteExercise}
                          onAddWeight={onAddWeight}
                          onDeleteWeight={onDeleteWeight}
                          onExerciseNameChange={onExerciseNameChange}
                          onWeightChange={onWeightChange}
                          forceExpanded={exercise.id === lastAddedExerciseId}
                        />
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </List>
              )}
            </Droppable>
          </DragDropContext>
        </Collapse>
      </ListItem>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          onDelete(bodyPart.id);
          setDeleteDialogOpen(false);
        }}
        itemType="body part"
        itemName={bodyPart.name}
      />
    </>
  );
});

const WorkoutTracker = () => {
  const [bodyParts, setBodyParts] = useState([]);

  useEffect(() => {
    const workoutRef = ref(appDb, "workouts");

    const workoutListener = onValue(workoutRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const bodyPartsArray = Object.entries(data)
          .map(([id, value]) => ({
            id,
            ...value,
            exercises: value.exercises
              ? Object.entries(value.exercises)
                  .map(([exerciseId, exercise]) => ({
                    id: exerciseId,
                    ...exercise,
                    weights: exercise.weights
                      ? Object.entries(exercise.weights)
                          .map(([weightId, weight]) => ({
                            id: weightId,
                            ...weight
                          }))
                          .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
                      : []
                  }))
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
              : []
          }))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setBodyParts(bodyPartsArray);
      } else {
        setBodyParts([]);
      }
    });

    return () => {
      off(workoutRef, "value", workoutListener);
    };
  }, []);

  const updateBodyPartsInDatabase = useCallback(
    async (updatedBodyParts) => {
      const updates = {};
      updatedBodyParts.forEach((bodyPart, index) => {
        updates[`workouts/${bodyPart.id}`] = {
          id: bodyPart.id,
          name: bodyPart.name,
          order: index,
          exercises: bodyPart.exercises
            ? Object.fromEntries(
                bodyPart.exercises.map((exercise) => [
                  exercise.id,
                  {
                    id: exercise.id,
                    name: exercise.name,
                    order: exercise.order,
                    weights: exercise.weights
                      ? Object.fromEntries(
                          exercise.weights.map((weight) => [
                            weight.id,
                            {
                              id: weight.id,
                              timestamp: weight.timestamp,
                              value: weight.value
                            }
                          ])
                        )
                      : {}
                  }
                ])
              )
            : {}
        };
      });
      await update(ref(appDb), updates);
    },
    []
  );

  const handleDragEnd = useCallback(
    async (result) => {
      if (!result.destination) return;

      const newBodyParts = Array.from(bodyParts);
      const [movedItem] = newBodyParts.splice(result.source.index, 1);
      newBodyParts.splice(result.destination.index, 0, movedItem);

      await updateBodyPartsInDatabase(newBodyParts);
    },
    [bodyParts, updateBodyPartsInDatabase]
  );

  const addBodyPart = useCallback(async () => {
    const newBodyPartId = generateUniqueId("bp");
    const newBodyPart = {
      id: newBodyPartId,
      name: "",
      exercises: {},
      order: bodyParts.length
    };

    await set(ref(appDb, `workouts/${newBodyPartId}`), newBodyPart);
  }, [bodyParts.length]);

  const deleteBodyPart = useCallback(async (bodyPartId) => {
    await remove(ref(appDb, `workouts/${bodyPartId}`));
  }, []);

  const addExercise = useCallback(
    async (bodyPartId) => {
      const newExerciseId = generateUniqueId("ex");
      const bodyPart = bodyParts.find((bp) => bp.id === bodyPartId);
      const currentExercises = bodyPart?.exercises || [];

      const newExercise = {
        id: newExerciseId,
        name: "",
        weights: {},
        order: currentExercises.length
      };

      await set(ref(appDb, `workouts/${bodyPartId}/exercises/${newExerciseId}`), newExercise);
      return newExerciseId;
    },
    [bodyParts]
  );

  const deleteExercise = useCallback(async (bodyPartId, exerciseId) => {
    await remove(ref(appDb, `workouts/${bodyPartId}/exercises/${exerciseId}`));
  }, []);

  const addWeight = useCallback(async (bodyPartId, exerciseId) => {
    const newWeightId = generateUniqueId("wt");
    const newWeight = {
      id: newWeightId,
      timestamp: new Date().toLocaleString(),
      value: ""
    };

    await set(ref(appDb, `workouts/${bodyPartId}/exercises/${exerciseId}/weights/${newWeightId}`), newWeight);
  }, []);

  const deleteWeight = useCallback(async (bodyPartId, exerciseId, weightId) => {
    await remove(ref(appDb, `workouts/${bodyPartId}/exercises/${exerciseId}/weights/${weightId}`));
  }, []);

  const handleBodyPartNameChange = useCallback(async (bodyPartId, name) => {
    await set(ref(appDb, `workouts/${bodyPartId}/name`), name);
  }, []);

  const handleExerciseNameChange = useCallback(async (bodyPartId, exerciseId, name) => {
    await set(ref(appDb, `workouts/${bodyPartId}/exercises/${exerciseId}/name`), name);
  }, []);

  const handleWeightChange = useCallback(async (bodyPartId, exerciseId, weightId, value) => {
    await set(ref(appDb, `workouts/${bodyPartId}/exercises/${exerciseId}/weights/${weightId}/value`), value);
  }, []);

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