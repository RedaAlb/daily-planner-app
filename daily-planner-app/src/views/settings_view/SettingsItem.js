import React, { useEffect, useState } from "react";
import { Storage } from "@capacitor/storage";

import { ListItem, ListItemIcon, ListItemText, Switch } from "@mui/material";

import { SETTING_ITEM_HEIGHT } from "../../utils/constants";


function SettingsItem(props) {
  const [toggle, setToggle] = useState(false);


  const onItemClick = async () => {
    // If it does not have an onClick prop then its a toggle settings item.
    if (props.onClick) {
      props.onClick();
    } else {
      const newToggle = !toggle;
      setToggle(newToggle);

      if (props.saveKey) {
        await Storage.set({ key: props.saveKey, value: JSON.stringify(newToggle) })
      }
    }
  }


  useEffect(() => {
    // If its a setting item that stores a value, e.g. a toggle, load the saved value.
    if (props.saveKey) {
      const loadSavedValue = async () => {
        const { value } = await Storage.get({ key: props.saveKey });

        if (value !== null) {
          const valueBool = JSON.parse(value);
          setToggle(valueBool);
        }
      }

      loadSavedValue();
    }
  }, [props.saveKey])


  return (
    <ListItem
      button
      onClick={onItemClick}
      style={{ height: SETTING_ITEM_HEIGHT, borderBottom: "1px solid #b8b8b8" }}
    >
      <ListItemIcon> {props.icon} </ListItemIcon>
      <ListItemText primary={props.text} />
      {props.switch ? (
        <Switch checked={toggle} />
      ) : null}
    </ListItem>
  )
}

export default SettingsItem;