import React, { useState, useMemo } from 'react';
import { Popover, Autocomplete, TextField, Box } from '@mui/material';

const GroupAssigner = ({
  anchorEl,
  onClose,
  groups,
  currentGroupId,
  onAssignGroup,
  onCreateGroup
}) => {
  const open = Boolean(anchorEl);
  const [inputValue, setInputValue] = useState("");

  const options = useMemo(() => {
    return Object.values(groups || {}).map(g => ({
      id: g.id,
      name: g.name
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [groups]);

  const currentOption = options.find(o => o.id === currentGroupId) || null;

  const handleChange = async (event, newValue) => {
    if (typeof newValue === 'string') {
      const newId = await onCreateGroup(newValue);
      onAssignGroup(newId);
    } else if (newValue && newValue.inputValue) {
      const newId = await onCreateGroup(newValue.inputValue);
      onAssignGroup(newId);
    } else if (newValue) {
      onAssignGroup(newValue.id);
    } else {
      onAssignGroup(null);
    }
    onClose();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      transitionDuration={0}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
    >
      <Box sx={{ p: 2, width: 250 }}>
        <Autocomplete
          value={currentOption}
          onChange={handleChange}
          inputValue={inputValue}
          onInputChange={(event, newInputValue) => {
            setInputValue(newInputValue);
          }}
          options={options}
          getOptionLabel={(option) => {
            if (typeof option === 'string') return option;
            if (option.inputValue) return option.inputValue;
            return option.name;
          }}
          renderOption={(props, option) => <li {...props} key={option.id}>{option.name}</li>}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          freeSolo
          selectOnFocus
          clearOnBlur
          handleHomeEndKeys
          openOnFocus
          renderInput={(params) => (
            <TextField {...params} label="Assign Group" variant="outlined" size="small" autoFocus />
          )}
        />
      </Box>
    </Popover>
  );
};

export default GroupAssigner;
