import React from "react";
import { MLProvider, useML } from "./components/MLContext";
import { StepLayout } from "./components/StepLayout";
import { ClinicalContext } from "./components/steps/ClinicalContext";
import { DataExploration } from "./components/steps/DataExploration";
import { DataPreparation } from "./components/steps/DataPreparation";
import { ModelParameters } from "./components/steps/ModelParameters";
import { Results } from "./components/steps/Results";
import { Explainability } from "./components/steps/Explainability";
import { EthicsBias } from "./components/steps/EthicsBias";

/**
 * Renders the active pipeline step component based on `currentStep` from MLContext.
 * Steps 0–6 map to: ClinicalContext, DataExploration, DataPreparation,
 * ModelParameters, Results, Explainability, EthicsBias.
 */
function StepRouter() {
  const { currentStep } = useML();

  const steps = [
    <ClinicalContext key="clinical" />,
    <DataExploration key="data" />,
    <DataPreparation key="prep" />,
    <ModelParameters key="model" />,
    <Results key="results" />,
    <Explainability key="explain" />,
    <EthicsBias key="ethics" />,
  ];

  return steps[currentStep] || steps[0];
}

/**
 * Root application component.
 * Wraps the app in {@link MLProvider} and {@link StepLayout}, then renders {@link StepRouter}.
 */
export default function App() {
  return (
    <MLProvider>
      <StepLayout>
        <StepRouter />
      </StepLayout>
    </MLProvider>
  );
}
