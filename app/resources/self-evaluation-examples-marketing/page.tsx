import {
  SelfEvaluationExamplesPage,
  buildSelfEvaluationMetadata,
} from "@/components/resources/SelfEvaluationExamplesPage";
import { getSelfEvaluationPage } from "@/lib/resources/selfEvaluationPages";

const page = getSelfEvaluationPage("self-evaluation-examples-marketing");

export const metadata = buildSelfEvaluationMetadata(page);

export default function MarketingSelfEvaluationPage() {
  return <SelfEvaluationExamplesPage page={page} />;
}
