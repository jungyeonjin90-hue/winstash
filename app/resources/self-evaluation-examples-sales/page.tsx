import {
  SelfEvaluationExamplesPage,
  buildSelfEvaluationMetadata,
} from "@/components/resources/SelfEvaluationExamplesPage";
import { getSelfEvaluationPage } from "@/lib/resources/selfEvaluationPages";

const page = getSelfEvaluationPage("self-evaluation-examples-sales");

export const metadata = buildSelfEvaluationMetadata(page);

export default function SalesSelfEvaluationPage() {
  return <SelfEvaluationExamplesPage page={page} />;
}
