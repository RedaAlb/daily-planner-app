import React, { useState, useEffect, memo } from 'react';
import { TextareaAutosize } from '@mui/material';
import useDebounce from '../../hooks/useDebounce';

const DebouncedTextArea = memo(({ value, onChange, style }) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const debouncedOnChange = useDebounce(onChange, 300);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  };

  return (
    <TextareaAutosize
      value={localValue}
      onChange={handleChange}
      style={style}
    />
  );
});

export default DebouncedTextArea;
