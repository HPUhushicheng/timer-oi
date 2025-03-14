import { app } from 'electron'
import fs from 'fs/promises'
import path from 'path'
export async function getArtifactsPrompt() {
  const artifactPrompt = path.join(app.getAppPath(), 'resources', 'artifacts_prompt.md')
  const prompt = await fs.readFile(artifactPrompt, 'utf-8')
  return prompt
}
