import React, { useState, useEffect, memo } from "react";
import { ListItem, Box, TextField, IconButton, Collapse, Paper } from "@mui/material";
import useDebounce from "../../hooks/useDebounce";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import WeightEntry from "./WeightEntry";
import DeleteDialog from "../ui/DeleteDialog";

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
  const [localName, setLocalName] = useState(exercise.name);

  useEffect(() => {
    setLocalName(exercise.name);
  }, [exercise.name]);

  const debouncedNameChange = useDebounce((val) => {
    onExerciseNameChange(bodyPartId, exercise.id, val);
  }, 300);

  const handleNameChange = (e) => {
    setLocalName(e.target.value);
    debouncedNameChange(e.target.value);
  };

  const handleBlur = (e) => {
    onExerciseNameChange(bodyPartId, exercise.id, e.target.value);
  };

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
            value={localName}
            onChange={handleNameChange}
            onBlur={handleBlur}
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
            {exercise.weights && Object.values(exercise.weights).map((weight) => (
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

      <DeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          onDelete(bodyPartId, exercise.id);
          setDeleteDialogOpen(false);
        }}
        itemText={exercise.name}
        textPrefix="Delete exercise:"
      />
    </>
  );
});

export default ExerciseItem;
