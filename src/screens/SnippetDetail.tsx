import {useEffect, useRef, useState} from "react";
import Editor from "react-simple-code-editor";
import {highlight, languages} from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism-okaidia.css";
import {Alert, Box, CircularProgress, IconButton, Menu, MenuItem, Tooltip, Typography} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import {
  useUpdateSnippetById
} from "../utils/queries.tsx";
import {useFormatSnippet, useGetSnippetById, useShareSnippet} from "../utils/queries.tsx";
import {Bòx} from "../components/snippet-table/SnippetBox.tsx";
import {BugReport, Delete, Download, Edit, PlayArrow, Save, Share} from "@mui/icons-material";
import {ShareSnippetModal} from "../components/snippet-detail/ShareSnippetModal.tsx";
import {TestSnippetModal} from "../components/snippet-test/TestSnippetModal.tsx";
import {CreateSnippet, Snippet} from "../types/snippet.ts";
import {SnippetExecution, SnippetExecutionHandle} from "./SnippetExecution.tsx";
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import {queryClient} from "../App.tsx";
import {DeleteConfirmationModal} from "../components/snippet-detail/DeleteConfirmationModal.tsx";
import {AddSnippetModal} from "../components/snippet-table/AddSnippetModal.tsx";
import { useSnippetsOperations } from "../utils/queries.tsx";
import axios from "axios";

type SnippetDetailProps = {
  id: string;
  handleCloseModal: () => void;
}

const DownloadButton = ({snippet}: { snippet?: Snippet }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const {mutateAsync: formatSnippet, isLoading: isFormatLoading} = useFormatSnippet();

  if (!snippet) return null;

  const handleDownload = async (formatted: boolean) => {
    setAnchorEl(null);

    let content = snippet.content;

    if (formatted) {
      try {
        content = await formatSnippet({
          snippetId: snippet.id,
          code: snippet.content
        });
      } catch (error) {
        console.error("Error formatting snippet:", error);
        alert("Error formatting snippet. Please try again.");
        return;
      }
    }

    const blob = new Blob([content], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${snippet.name}.${snippet.extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Tooltip title="Download">
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
          <Download/>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => handleDownload(false)}>
          Download Original
        </MenuItem>
        <MenuItem onClick={() => handleDownload(true)} disabled={isFormatLoading}>
          Download Formatted
        </MenuItem>
      </Menu>
    </>
  );
}

export const SnippetDetail = (props: SnippetDetailProps) => {
  const {id, handleCloseModal} = props;
  const [code, setCode] = useState(
      ""
  );
  const [shareModalOpened, setShareModalOpened] = useState(false)
  const [deleteConfirmationModalOpen, setDeleteConfirmationModalOpen] = useState(false)
  const [testModalOpened, setTestModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const executionRef = useRef<SnippetExecutionHandle>(null);

  const {data: snippet, isLoading} = useGetSnippetById(id);
  const {mutateAsync: shareSnippet, isLoading: loadingShare} = useShareSnippet()
  const {mutate: formatSnippet, isLoading: isFormatLoading, data: formatSnippetData} = useFormatSnippet()
  const {mutateAsync: updateSnippet, isLoading: isUpdateSnippetLoading} = useUpdateSnippetById({onSuccess: () => queryClient.invalidateQueries(['snippet', id])})
  const snippetOperations = useSnippetsOperations();

    const fetchPermissionsForUser = async (
        userId: string
    ): Promise<{ read: boolean; write: boolean }> => {
        const perms = await snippetOperations.getUserSnippetPermissions(id, userId);

        return perms;
    };

  const handleRunSnippet = () => {
    if (snippet && executionRef.current) {
      executionRef.current.connect();
      executionRef.current.startExecution(code, snippet.version);
    }
  };

  useEffect(() => {
    if (snippet) {
      setCode(snippet.content);
    }
  }, [snippet]);

  useEffect(() => {
    if (formatSnippetData) {
      setCode(formatSnippetData)
    }
  }, [formatSnippetData])

  useEffect(() => {
    setValidationErrors([]);
  }, [code])


  async function handleShareSnippet(userId: string, permissions: { read: boolean; write: boolean }) {
      try {
          await shareSnippet({snippetId: id, userId, permissions});
          setShareModalOpened(false);
      } catch (e) {
          console.error(e);
      }
  }

  async function handleEditSnippet(snippetData: CreateSnippet) {
    await updateSnippet({
      id: id,
      updateSnippet: {
        name: snippetData.name,
        description: snippetData.description,
        content: snippetData.content,
        language: snippetData.language,
        version: snippetData.version
      }
    });
    setEditModalOpened(false);
  }

  async function handleSaveContent() {
    setValidationErrors([]);

    try {
      await updateSnippet({id: id, updateSnippet: {content: code}});
      queryClient.invalidateQueries(['snippet', id]);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.errors && Array.isArray(errorData.errors)) {
          setValidationErrors(errorData.errors);
        } else {
          setValidationErrors([errorData.message || "Validation failed"]);
        }
      } else {
        setValidationErrors(["An unexpected error occurred. Please try again."]);
      }
    }
  }

  return (
      <Box p={4} minWidth={'60vw'} maxWidth={'60vw'}>
        <Box width={'100%'} p={2} display={'flex'} justifyContent={'flex-end'}>
          <CloseIcon style={{cursor: "pointer"}} onClick={handleCloseModal}/>
        </Box>
        {
          isLoading ? (<>
            <Typography fontWeight={"bold"} mb={2} variant="h4">Loading...</Typography>
            <CircularProgress/>
          </>) : <>
            <Typography variant="h4" fontWeight={"bold"}>{snippet?.name ?? "Snippet"}</Typography>
            {snippet?.description && (
              <Typography variant="body1" color="text.secondary" sx={{mb: 1, wordWrap: 'break-word'}}>
                {snippet.description}
              </Typography>
            )}
            <Box display="flex" gap={2} mb={1}>
              <Typography variant="body2" color="text.secondary">
                Language: <strong>{snippet?.language}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Version: <strong>{snippet?.version}</strong>
              </Typography>
            </Box>
            <Box display="flex" flexDirection="row" gap="8px" padding="8px">
              <Tooltip title={"Edit Details"}>
                <IconButton onClick={() => setEditModalOpened(true)}>
                  <Edit/>
                </IconButton>
              </Tooltip>
              <Tooltip title={"Share"}>
                <IconButton onClick={() => setShareModalOpened(true)}>
                  <Share/>
                </IconButton>
              </Tooltip>
              <Tooltip title={"Test"}>
                <IconButton onClick={() => setTestModalOpened(true)}>
                  <BugReport/>
                </IconButton>
              </Tooltip>
              <DownloadButton snippet={snippet}/>
              <Tooltip title="Run">
                <IconButton onClick={handleRunSnippet}>
                  <PlayArrow/>
                </IconButton>
              </Tooltip>
              <Tooltip title={"Format"}>
                <IconButton onClick={() => formatSnippet({ snippetId: id, code })} disabled={isFormatLoading}>
                  <ReadMoreIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={"Save changes"}>
                <IconButton color={"primary"} onClick={handleSaveContent} disabled={isUpdateSnippetLoading || snippet?.content === code} >
                  <Save />
                </IconButton>
              </Tooltip>
              <Tooltip title={"Delete"}>
                <IconButton onClick={() => setDeleteConfirmationModalOpen(true)} >
                  <Delete color={"error"} />
                </IconButton>
              </Tooltip>
            </Box>
            {validationErrors.length > 0 && (
              <Alert severity="error" sx={{mt: 2}}>
                <Typography variant="subtitle2" fontWeight="bold">Validation Errors:</Typography>
                <ul style={{margin: '8px 0', paddingLeft: '20px'}}>
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </Alert>
            )}
            <Box display={"flex"} gap={2}>
              <Bòx flex={1} height={"fit-content"} overflow={"none"} minHeight={"500px"} bgcolor={'black'} color={'white'} code={code}>
                <Editor
                    value={code}
                    padding={10}
                    onValueChange={(code) => setCode(code)}
                    highlight={(code) => highlight(code, languages.js, "javascript")}
                    maxLength={1000}
                    style={{
                      minHeight: "500px",
                      fontFamily: "monospace",
                      fontSize: 17,
                    }}
                />
              </Bòx>
            </Box>
            <Box pt={1} flex={1} marginTop={2}>
              <Alert severity="info">Output</Alert>
              <SnippetExecution ref={executionRef} />
            </Box>
          </>
        }
        <ShareSnippetModal loading={loadingShare || isLoading}
                           open={shareModalOpened}
                           onClose={() => setShareModalOpened(false)}
                           onShare={handleShareSnippet}
                           getPermissionsForUser={fetchPermissionsForUser}/>
        <TestSnippetModal open={testModalOpened} onClose={() => setTestModalOpened(false)} snippetId={id}/>
        <DeleteConfirmationModal open={deleteConfirmationModalOpen} onClose={() => setDeleteConfirmationModalOpen(false)} id={snippet?.id ?? ""} setCloseDetails={handleCloseModal} />
        <AddSnippetModal
          open={editModalOpened}
          onClose={() => setEditModalOpened(false)}
          title="Edit Snippet"
          defaultSnippet={snippet}
          onSubmit={handleEditSnippet}
        />
      </Box>
  );
}

