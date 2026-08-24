/* @proprietary license */

import { IntegrationSurfaceGroup } from '@/components/docs/integration-surface-group';
import {
  getTaskReferences,
  type TaskGuideKey,
} from '@/lib/docs/service-references';
import { getDocsLocale } from '@/lib/utils/docs-locale';

export async function TaskSurfaces({ task }: { task: TaskGuideKey }) {
  const locale = await getDocsLocale();
  const references = getTaskReferences(task, locale);
  return (
    <IntegrationSurfaceGroup id={`task-${task}`} references={references} />
  );
}
