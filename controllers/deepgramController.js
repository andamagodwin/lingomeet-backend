const { createClient } = require("@deepgram/sdk");
const client = createClient(process.env.DEEPGRAM_API_KEY);

const getProjectId = async () => {
  const { result, error } = await client.manage.getProjects();

  if (error) {
    throw error;
  }

  return result.projects[0].project_id;
};

const getTempApiKey = async (projectId) => {
  const { result, error } = await client.manage.createProjectKey(projectId, {
    comment: "short lived",
    scopes: ["usage:write"],
    time_to_live_in_seconds: 20,
  });

  if (error) {
    throw error;
  }

  return result;
};

exports.getKey = async (req, res) => {
  try {
    const projectId = await getProjectId();
    const key = await getTempApiKey(projectId);
    res.json(key);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

