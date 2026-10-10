import {
  SelfEvaluationExamplesPage,
  buildSelfEvaluationMetadata,
} from "@/components/resources/SelfEvaluationExamplesPage";
import { getSelfEvaluationPage } from "@/lib/resources/selfEvaluationPages";

const page = getSelfEvaluationPage("self-evaluation-examples-ux-designers");

export const metadata = buildSelfEvaluationMetadata(page);

export default function UxDesignersSelfEvaluationPage() {
  return <SelfEvaluationExamplesPage page={page} />;
}
