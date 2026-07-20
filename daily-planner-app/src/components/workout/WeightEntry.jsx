import React, { useState, useEffect, memo } from "react";
import { Box, TextField, IconButton } from "@mui/material";
import useDebounce from "../../hooks/useDebounce";
import CloseIcon from "@mui/icons-material/Close";
import DeleteDialog from "../ui/DeleteDialog";

const WeightEntry = memo(({ weight, onDelete, onWeightChange }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [localValue, setLocalValue] = useState(weight.value);

  useEffect(() => {
    setLocalValue(weight.value);
  }, [weight.value]);

  const debouncedChange = useDebounce((val) => {
    onWeightChange(weight.id, val);
  }, 300);

  const handleValueChange = (e) => {
    setLocalValue(e.target.value);
    debouncedChange(e.target.value);
  };

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
          value={localValue}
          onChange={handleValueChange}
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

      <DeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          onDelete(weight.id);
          setDeleteDialogOpen(false);
        }}
        itemText={`${weight.timestamp} ${weight.value} kg`}
        textPrefix="Delete weight:"
      />
    </>
  );
});

export default WeightEntry;
