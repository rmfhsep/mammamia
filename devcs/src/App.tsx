import { useState } from 'react';
import { QuizDetailScreen } from './screens/QuizDetailScreen';
import { QuizListScreen } from './screens/QuizListScreen';

function App() {
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  if (selectedQuestionId) {
    return (
      <QuizDetailScreen
        questionId={selectedQuestionId}
        onBack={() => setSelectedQuestionId(null)}
      />
    );
  }

  return <QuizListScreen onSelectQuestion={setSelectedQuestionId} />;
}

export default App;
