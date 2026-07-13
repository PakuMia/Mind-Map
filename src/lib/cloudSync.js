import { supabase } from './supabaseClient.js';

const boardToRow = (board, userId) => ({
  id: board.id,
  user_id: userId,
  project_id: board.projectId,
  name: board.name,
  nodes: board.nodes,
  edges: board.edges,
  background: board.background || null,
  updated_at: new Date().toISOString(),
});

const rowToBoard = (row) => ({
  id: row.id,
  projectId: row.project_id,
  name: row.name,
  nodes: row.nodes || [],
  edges: row.edges || [],
  background: row.background || undefined,
});

const projectToRow = (project, userId) => ({ id: project.id, user_id: userId, name: project.name });
const rowToProject = (row) => ({ id: row.id, name: row.name });

const archiveToRow = (archive, userId) => ({
  id: archive.id,
  user_id: userId,
  name: archive.name,
  board: archive,
  archived_at: archive.archivedAt || new Date().toISOString(),
});
const rowToArchive = (row) => ({ ...row.board, id: row.id });

export async function fetchCloudState(userId) {
  const [{ data: boardRows, error: boardsError }, { data: projectRows, error: projectsError }, { data: archiveRows, error: archivesError }] =
    await Promise.all([
      supabase.from('boards').select('*').eq('user_id', userId),
      supabase.from('projects').select('*').eq('user_id', userId),
      supabase.from('archives').select('*').eq('user_id', userId).order('archived_at', { ascending: false }),
    ]);
  if (boardsError || projectsError || archivesError) {
    throw boardsError || projectsError || archivesError;
  }
  return {
    boards: (boardRows || []).map(rowToBoard),
    projects: (projectRows || []).map(rowToProject),
    archives: (archiveRows || []).map(rowToArchive),
  };
}

export async function pushBoards(userId, boards) {
  if (boards.length) await supabase.from('boards').upsert(boards.map((b) => boardToRow(b, userId)));
  const { data: existing } = await supabase.from('boards').select('id').eq('user_id', userId);
  const keep = new Set(boards.map((b) => b.id));
  const toDelete = (existing || []).filter((r) => !keep.has(r.id)).map((r) => r.id);
  if (toDelete.length) await supabase.from('boards').delete().in('id', toDelete);
}

export async function pushProjects(userId, projects) {
  if (projects.length) await supabase.from('projects').upsert(projects.map((p) => projectToRow(p, userId)));
  const { data: existing } = await supabase.from('projects').select('id').eq('user_id', userId);
  const keep = new Set(projects.map((p) => p.id));
  const toDelete = (existing || []).filter((r) => !keep.has(r.id)).map((r) => r.id);
  if (toDelete.length) await supabase.from('projects').delete().in('id', toDelete);
}

export async function pushArchives(userId, archives) {
  if (archives.length) await supabase.from('archives').upsert(archives.map((a) => archiveToRow(a, userId)));
  const { data: existing } = await supabase.from('archives').select('id').eq('user_id', userId);
  const keep = new Set(archives.map((a) => a.id));
  const toDelete = (existing || []).filter((r) => !keep.has(r.id)).map((r) => r.id);
  if (toDelete.length) await supabase.from('archives').delete().in('id', toDelete);
}
