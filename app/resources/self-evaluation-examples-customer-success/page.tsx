import {
  SelfEvaluationExamplesPage,
  buildSelfEvaluationMetadata,
} from "@/components/resources/SelfEvaluationExamplesPage";
import { getSelfEvaluationPage } from "@/lib/resources/selfEvaluationPages";

const page = getSelfEvaluationPage("self-evaluation-examples-customer-success");

export const metadata = buildSelfEvaluationMetadata(page);

export default function CustomerSuccessSelfEvaluationPage() {
  return <SelfEvaluationExamplesPage page={page} />;
}
