import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, update, set, remove } from 'firebase/database';
import { appDb } from '../utils/Firebase';
import { WORKOUTS_PATH } from '../utils/constants';

const generateUniqueId = (prefix) => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const useWorkouts = () => {
  const [bodyParts, setBodyParts] = useState([]);

  useEffect(() => {
    const workoutRef = ref(appDb, WORKOUTS_PATH);

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
      workoutListener();
    };
  }, []);

  const updateBodyPartsInDatabase = useCallback(
    async (updatedBodyParts) => {
      const updates = {};
      updatedBodyParts.forEach((bodyPart, index) => {
        updates[`${WORKOUTS_PATH}/${bodyPart.id}`] = {
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

    await set(ref(appDb, `${WORKOUTS_PATH}/${newBodyPartId}`), newBodyPart);
  }, [bodyParts.length]);

  const deleteBodyPart = useCallback(async (bodyPartId) => {
    await remove(ref(appDb, `${WORKOUTS_PATH}/${bodyPartId}`));
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

      await set(ref(appDb, `${WORKOUTS_PATH}/${bodyPartId}/exercises/${newExerciseId}`), newExercise);
      return newExerciseId;
    },
    [bodyParts]
  );

  const deleteExercise = useCallback(async (bodyPartId, exerciseId) => {
    await remove(ref(appDb, `${WORKOUTS_PATH}/${bodyPartId}/exercises/${exerciseId}`));
  }, []);

  const addWeight = useCallback(async (bodyPartId, exerciseId) => {
    const newWeightId = generateUniqueId("wt");
    const newWeight = {
      id: newWeightId,
      timestamp: new Date().toLocaleString(),
      value: ""
    };

    await set(ref(appDb, `${WORKOUTS_PATH}/${bodyPartId}/exercises/${exerciseId}/weights/${newWeightId}`), newWeight);
  }, []);

  const deleteWeight = useCallback(async (bodyPartId, exerciseId, weightId) => {
    await remove(ref(appDb, `${WORKOUTS_PATH}/${bodyPartId}/exercises/${exerciseId}/weights/${weightId}`));
  }, []);

  const handleBodyPartNameChange = useCallback(async (bodyPartId, name) => {
    await set(ref(appDb, `${WORKOUTS_PATH}/${bodyPartId}/name`), name);
  }, []);

  const handleExerciseNameChange = useCallback(async (bodyPartId, exerciseId, name) => {
    await set(ref(appDb, `${WORKOUTS_PATH}/${bodyPartId}/exercises/${exerciseId}/name`), name);
  }, []);

  const handleWeightChange = useCallback(async (bodyPartId, exerciseId, weightId, value) => {
    await set(ref(appDb, `${WORKOUTS_PATH}/${bodyPartId}/exercises/${exerciseId}/weights/${weightId}/value`), value);
  }, []);

  const handleExerciseDragEnd = useCallback(async (result, bodyPartId) => {
    if (!result.destination) return;

    const bodyPart = bodyParts.find((bp) => bp.id === bodyPartId);
    if (!bodyPart) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    const exercises = Array.from(bodyPart.exercises || []);
    const [removed] = exercises.splice(sourceIndex, 1);
    exercises.splice(destinationIndex, 0, removed);

    const updates = {};
    exercises.forEach((exercise, index) => {
      updates[`${WORKOUTS_PATH}/${bodyPart.id}/exercises/${exercise.id}/order`] = index;
    });

    await update(ref(appDb), updates);
  }, [bodyParts]);

  return {
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
  };
};

export default useWorkouts;
