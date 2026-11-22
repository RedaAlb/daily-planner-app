import React, { useState, useEffect, useRef, memo } from 'react';
import { TextareaAutosize } from '@mui/material';
import useDebounce from '../../hooks/useDebounce';

const DebouncedTextArea = memo(({ value, onChange, style }) => {
  const [localValue, setLocalValue] = useState(value);
  const isDirtyRef = useRef(false);

  useEffect(() => {
    isDirtyRef.current = false;
    setLocalValue(value);
  }, [value]);

  const debouncedOnChange = useDebounce((newValue) => {
    isDirtyRef.current = false;
    onChange(newValue);
  }, 300);

  const handleChange = (e) => {
    const newValue = e.target.value;
    isDirtyRef.current = true;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  };

  const handleBlur = () => {
    if (isDirtyRef.current) {
      debouncedOnChange.flush();
    }
  };

  return (
    <TextareaAutosize
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      style={style}
    />
  );
});

export default DebouncedTextArea;
