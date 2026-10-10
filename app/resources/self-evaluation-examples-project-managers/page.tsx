import {
  SelfEvaluationExamplesPage,
  buildSelfEvaluationMetadata,
} from "@/components/resources/SelfEvaluationExamplesPage";
import { getSelfEvaluationPage } from "@/lib/resources/selfEvaluationPages";

const page = getSelfEvaluationPage("self-evaluation-examples-project-managers");

export const metadata = buildSelfEvaluationMetadata(page);

export default function ProjectManagersSelfEvaluationPage() {
  return <SelfEvaluationExamplesPage page={page} />;
}
