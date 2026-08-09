import React, { useState, useEffect, useMemo } from 'react';
import { Popover, Autocomplete, TextField, Box } from '@mui/material';
import { ref, onValue } from 'firebase/database';
import { appDb, createGlobalTaskGroup } from '../utils/Firebase';
import { GLOBAL_TASK_GROUPS_PATH } from '../utils/constants';

const GroupAssigner = ({
  anchorEl,
  onClose,
  groups,
  currentGroupId,
  onAssignGroup,
  onCreateGroup
}) => {
  const open = Boolean(anchorEl);
  const [internalGroups, setInternalGroups] = useState({});

  useEffect(() => {
    if (groups !== undefined) return;
    const groupsRef = ref(appDb, GLOBAL_TASK_GROUPS_PATH);
    const unsubscribe = onValue(groupsRef, (snapshot) => {
      setInternalGroups(snapshot.val() || {});
    }, (err) => {
      console.error("Firebase error fetching groups in GroupAssigner:", err);
      setInternalGroups({});
    });
    return () => unsubscribe();
  }, [groups]);

  const effectiveGroups = groups !== undefined ? groups : internalGroups;
  const effectiveCreateGroup = onCreateGroup || createGlobalTaskGroup;

  const options = useMemo(() => {
    return Object.values(effectiveGroups || {}).map(g => ({
      id: g.id,
      name: g.name
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [effectiveGroups]);

  const currentOption = options.find(o => o.id === currentGroupId) || null;

  const handleChange = async (event, newValue) => {
    if (typeof newValue === 'string') {
      const newId = await effectiveCreateGroup(newValue);
      onAssignGroup(newId);
    } else if (newValue && newValue.inputValue) {
      const newId = await effectiveCreateGroup(newValue.inputValue);
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
      disableScrollLock={true}
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
          key={currentGroupId || 'empty'}
          value={currentOption}
          onChange={handleChange}
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
