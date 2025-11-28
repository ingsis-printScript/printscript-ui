import {Autocomplete, Box, Button, Divider, Checkbox, FormControlLabel, TextField, Typography} from "@mui/material";
import {ModalWrapper} from "../common/ModalWrapper.tsx";
import {useGetUsers} from "../../utils/queries.tsx";
import {useEffect, useState} from "react";
import {User} from "../../types/users.ts";
import { useAuth0 } from "@auth0/auth0-react";

type ShareSnippetModalProps = {
  open: boolean
  onClose: () => void
  onShare: (userId: string, permissions: { read: boolean; write: boolean }) => void
  loading: boolean
  getPermissionsForUser?: (userId: string) => Promise<{ read: boolean; write: boolean }>;
}
export const ShareSnippetModal = (props: ShareSnippetModalProps) => {
  const {open, onClose, onShare, loading, getPermissionsForUser} = props
  const [name, setName] = useState("")
  const [debouncedName, setDebouncedName] = useState("")
  const {data, isLoading} = useGetUsers(debouncedName, 0, 5)
  const [selectedUser, setSelectedUser] = useState<User | undefined>()
  const [canRead, setCanRead] = useState<boolean>(true)
  const [canWrite, setCanWrite] = useState<boolean>(false)
  const { user } = useAuth0();
  const currentUserId = user?.sub;
  const options = (data?.users ?? []).filter(
      (u) => u.id !== currentUserId
  );

    console.log('ShareSnippetModal getPermissionsForUser is defined?', !!getPermissionsForUser); // 👈

    useEffect(() => {
    const getData = setTimeout(() => {
      setDebouncedName(name)
    }, 3000)
    return () => clearTimeout(getData)
  }, [name])

    async function handleSelectUser(newValue: User | null) {
        console.log('handleSelectUser called with', newValue);
        setSelectedUser(newValue ?? undefined);

        if (newValue && getPermissionsForUser) {
            try {
                const perms = await getPermissionsForUser(newValue.id);
                setCanRead(perms.read);
                setCanWrite(perms.write);
            } catch (e) {
                console.error('Error fetching permissions', e);
                setCanRead(true);
                setCanWrite(false);
            }
        } else {
            setCanRead(true);
            setCanWrite(false);
        }
    }

  function toggleRead(checked: boolean) {
      setCanRead(checked);
      if (!checked) {
          setCanWrite(false);
      }
  }

  function toggleWrite(checked: boolean) {
      setCanWrite(checked);
      if (checked) {
          setCanRead(true);
      }
    }

  useEffect(() => {
      if (!open) {
          setSelectedUser(undefined);
          setName("");
          setDebouncedName("");
          setCanRead(true);
          setCanWrite(false);
      }
  }, [open]);


    return (
      <ModalWrapper open={open} onClose={onClose}>
        <Typography variant={"h5"}>Share your snippet</Typography>
        <Divider/>
        <Box mt={2}>
          <Autocomplete
              renderInput={(params) => <TextField {...params} label="Type the user's name"/>}
              options={options}
              isOptionEqualToValue={(option, value) =>
                  option.id === value.id
              }
              getOptionLabel={(option) => option.name}
              loading={isLoading}
              value={selectedUser}
              onInputChange={(_: unknown, newValue: string | null) => setName(newValue ?? "")}
              onChange={(_: unknown, newValue: User | null) => {
                  console.log('Autocomplete onChange newValue', newValue); // 👈
                  handleSelectUser(newValue);
              }}
          />

            <Box mt={2} display="flex" flexDirection="row" gap={2}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={canRead}
                            onChange={(e) => toggleRead(e.target.checked)}
                        />
                    }
                    label="Read"
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={canWrite}
                            onChange={(e) => toggleWrite(e.target.checked)}
                        />
                    }
                    label="Write"
                />
            </Box>

          <Box mt={4} display={"flex"} width={"100%"} justifyContent={"flex-end"}>
            <Button onClick={onClose} variant={"outlined"}>Cancel</Button>
            <Button disabled={!selectedUser || loading} onClick={() => selectedUser && onShare(selectedUser.id, { read: canRead, write: canWrite })} sx={{marginLeft: 2}} variant={"contained"}>Save permissions</Button>
          </Box>
        </Box>
      </ModalWrapper>
  )
}
