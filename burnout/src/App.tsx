import { useState } from 'react';
import { AddressScreen, type FoundTarget } from './screens/AddressScreen';
import { BurnScreen } from './screens/BurnScreen';

function App() {
  const [target, setTarget] = useState<FoundTarget | null>(null);

  if (target) {
    return <BurnScreen target={target} onExit={() => setTarget(null)} />;
  }

  return <AddressScreen onFound={setTarget} />;
}

export default App;
