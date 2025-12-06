import {
  Box,
  Button,
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  Select,
  SelectChangeEvent,
  styled,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography
} from "@mui/material";
import {AddSnippetModal} from "./AddSnippetModal.tsx";
import {useRef, useState} from "react";
import {Add, Clear, Search} from "@mui/icons-material";
import {LoadingSnippetRow, SnippetRow} from "./SnippetRow.tsx";
import {CreateSnippetWithLang, getFileLanguage, Snippet} from "../../types/snippet.ts";
import {usePaginationContext} from "../../contexts/paginationContext.tsx";
import {useSnackbarContext} from "../../contexts/snackbarContext.tsx";
import {useGetFileTypes} from "../../utils/queries.tsx";
import {RelationshipType} from "../../types/Relationship.ts";

type SnippetTableProps = {
  handleClickSnippet: (id: string) => void;
  snippets?: Snippet[];
  loading: boolean;
  handleSearchSnippet: (snippetName: string) => void;
  language?: string;
  lintStatus?: string;
  onLanguageChange: (language: string | undefined) => void;
  onLintStatusChange: (lintStatus: string | undefined) => void;
  onClearFilters: () => void;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  onSort: (field: string) => void;
  relationshipType: RelationshipType;
  onRelationshipTypeChange: (relationshipType: RelationshipType) => void;
}

export const SnippetTable = (props: SnippetTableProps) => {
  const {snippets, handleClickSnippet, loading, handleSearchSnippet, language, lintStatus, onLanguageChange, onLintStatusChange, onClearFilters, sortBy, sortOrder, onSort, relationshipType, onRelationshipTypeChange} = props;
  const [addModalOpened, setAddModalOpened] = useState(false);
  const [popoverMenuOpened, setPopoverMenuOpened] = useState(false)
  const [snippet, setSnippet] = useState<CreateSnippetWithLang | undefined>()

  const popoverRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const {page, page_size: pageSize, count, handleChangePageSize, handleGoToPage} = usePaginationContext()
  const {createSnackbar} = useSnackbarContext()
  const {data: fileTypes} = useGetFileTypes();

  const handleLoadSnippet = async (target: EventTarget & HTMLInputElement) => {
    const files = target.files
    if (!files || !files.length) {
      createSnackbar('error',"Please select at leat one file")
      return
    }
    const file = files[0]
    const splitName = file.name.split(".")
    const fileType = getFileLanguage(fileTypes ?? [], splitName.at(-1))
    if (!fileType) {
      createSnackbar('error', `File type ${splitName.at(-1)} not supported`)
      return
    }
    file.text().then((text) => {
      setSnippet({
        name: splitName[0],
        description: '',
        content: text,
        language: fileType.language,
        extension: fileType.extension,
        version: fileType.versions[fileType.versions.length - 1] ?? '1.1' // Default to latest version
      })
    }).catch(e => {
      console.error(e)
    }).finally(() => {
      setAddModalOpened(true)
      target.value = ""
    })
  }

  function handleClickMenu() {
    setPopoverMenuOpened(false)
  }

  return (
      <>
        <Box display="flex" flexDirection="row" justifyContent="space-between">
          <Box sx={{background: 'white', width: '30%', display: 'flex'}}>
            <InputBase
                sx={{ml: 1, flex: 1}}
                placeholder="Search FileType"
                inputProps={{'aria-label': 'search'}}
                onChange={e => handleSearchSnippet(e.target.value)}
            />
            <IconButton type="button" sx={{p: '10px'}} aria-label="search">
              <Search/>
            </IconButton>
          </Box>
          <Button ref={popoverRef} variant="contained" disableRipple sx={{boxShadow: 0}}
                  onClick={() => setPopoverMenuOpened(true)}>
            <Add/>
            Add Snippet
          </Button>
        </Box>

        {/* Filters Row */}
        <Box display="flex" flexDirection="row" alignItems="center" gap={2} mt={2} mb={2} p={2} sx={{background: 'white', borderRadius: 1}}>
          <Typography variant="body2" fontWeight="bold">Filters:</Typography>

          <Select
            value={language || ''}
            onChange={(e: SelectChangeEvent) => onLanguageChange(e.target.value || undefined)}
            displayEmpty
            size="small"
            sx={{minWidth: 150}}
          >
            <MenuItem value="">All Languages</MenuItem>
            {Array.isArray(fileTypes) && fileTypes.map((ft) => (
              <MenuItem key={ft.language} value={ft.language}>{ft.language}</MenuItem>
            ))}
          </Select>

          <Select
            value={lintStatus || ''}
            onChange={(e: SelectChangeEvent) => onLintStatusChange(e.target.value || undefined)}
            displayEmpty
            size="small"
            sx={{minWidth: 150}}
          >
            <MenuItem value="">All Compliance</MenuItem>
            <MenuItem value="COMPLIANT">Compliant</MenuItem>
            <MenuItem value="NON_COMPLIANT">Non-Compliant</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="FAILED">Failed</MenuItem>
          </Select>

            {/* Relationship */}
            <Select
                value={relationshipType}
                onChange={(e: SelectChangeEvent) =>
                    onRelationshipTypeChange(e.target.value as RelationshipType)
                }
                size="small"
                sx={{ minWidth: 180 }}
            >
                <MenuItem value="owner">Owned</MenuItem>
                <MenuItem value="shared">Shared</MenuItem>
                <MenuItem value="both">All (Owned + Shared)</MenuItem>
            </Select>


            <Button
            variant="outlined"
            size="small"
            startIcon={<Clear />}
            onClick={onClearFilters}
          >
            Clear Filters
          </Button>
        </Box>

        <Table size="medium" sx={{borderSpacing: "0 10px", borderCollapse: "separate"}}>
          <TableHead>
            <TableRow sx={{fontWeight: 'bold'}}>
              <StyledTableCell sx={{fontWeight: "bold"}}>
                <TableSortLabel
                  active={sortBy === 'name'}
                  direction={sortBy === 'name' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : 'asc'}
                  onClick={() => onSort('name')}
                >
                  Name
                </TableSortLabel>
              </StyledTableCell>
              <StyledTableCell sx={{fontWeight: "bold"}}>
                <TableSortLabel
                  active={sortBy === 'language'}
                  direction={sortBy === 'language' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : 'asc'}
                  onClick={() => onSort('language')}
                >
                  Language
                </TableSortLabel>
              </StyledTableCell>
              <StyledTableCell sx={{fontWeight: "bold"}}>Author</StyledTableCell>
              <StyledTableCell sx={{fontWeight: "bold"}}>
                <TableSortLabel
                  active={sortBy === 'lintStatus'}
                  direction={sortBy === 'lintStatus' ? (sortOrder === 'ASC' ? 'asc' : 'desc') : 'asc'}
                  onClick={() => onSort('lintStatus')}
                >
                  Conformance
                </TableSortLabel>
              </StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>{
            loading ? (
                <>
                  {Array.from({length: 10}).map((_, index) => (
                      <LoadingSnippetRow key={index}/>
                  ))}
                </>
            ) : (
                <>
                  {
                      snippets && snippets.map((snippet) => (
                          <SnippetRow data-testid={"snippet-row"}
                                      onClick={() => handleClickSnippet(snippet.id)} key={snippet.id} snippet={snippet}/>
                      ))
                  }
                </>
            )
          }
          </TableBody>
          <TablePagination count={count} page={page} rowsPerPage={pageSize}
                           onPageChange={(_, page) => handleGoToPage(page)}
                           onRowsPerPageChange={e => handleChangePageSize(Number(e.target.value))}/>
        </Table>
        <AddSnippetModal defaultSnippet={snippet} open={addModalOpened}
                         onClose={() => setAddModalOpened(false)}/>
        <Menu anchorEl={popoverRef.current} open={popoverMenuOpened} onClick={handleClickMenu}>
          <MenuItem onClick={() => setAddModalOpened(true)}>Create snippet</MenuItem>
          <MenuItem onClick={() => inputRef?.current?.click()}>Load snippet from file</MenuItem>
        </Menu>
        <input hidden type={"file"} ref={inputRef} multiple={false} data-testid={"upload-file-input"}
               onChange={e => handleLoadSnippet(e?.target)}/>
      </>
  )
}


export const StyledTableCell = styled(TableCell)`
    border: 0;
    align-items: center;
`
