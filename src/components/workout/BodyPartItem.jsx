import React, { useState, useEffect, useCallback, memo } from "react";
import { ListItem, Box, TextField, IconButton, Collapse, List } from "@mui/material";
import useDebounce from "../../hooks/useDebounce";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ExerciseItem from "./ExerciseItem";
import DeleteDialog from "../ui/DeleteDialog";

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
  onWeightChange,
  onExerciseDragEnd
}) => {
  const [expanded, setExpanded] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lastAddedExerciseId, setLastAddedExerciseId] = useState(null);
  const [localName, setLocalName] = useState(bodyPart.name);

  useEffect(() => {
    setLocalName(bodyPart.name);
  }, [bodyPart.name]);

  const debouncedNameChange = useDebounce((val) => {
    onBodyPartNameChange(bodyPart.id, val);
  }, 300);

  const handleNameChange = (e) => {
    setLocalName(e.target.value);
    debouncedNameChange(e.target.value);
  };

  const handleAddExercise = useCallback(() => {
    setExpanded(true);
    onAddExercise(bodyPart.id).then((newExerciseId) => {
      setLastAddedExerciseId(newExerciseId);
    });
  }, [bodyPart.id, onAddExercise]);

  const handleDragEndLocal = (result) => {
    onExerciseDragEnd(result, bodyPart.id);
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
            value={localName}
            onChange={handleNameChange}
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
          <DragDropContext onDragEnd={handleDragEndLocal}>
            <Droppable droppableId={`exercises-${bodyPart.id}`}>
              {(provided) => (
                <List {...provided.droppableProps} ref={provided.innerRef} sx={{p: 0, backgroundColor: "#f5f5f5"}} >
                  {bodyPart.exercises && Object.values(bodyPart.exercises).map((exercise, index) => (
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

      <DeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          onDelete(bodyPart.id);
          setDeleteDialogOpen(false);
        }}
        itemText={bodyPart.name}
        textPrefix="Delete body part:"
      />
    </>
  );
});

export default BodyPartItem;
