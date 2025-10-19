import Legacy from './App_legacy';
import SavingsPlanner from './pages/SavingsPlanner';

const ui = process.env.REACT_APP_UI || 'legacy';

export default function App() {
  return ui === 'refreshed' ? <SavingsPlanner /> : <Legacy />;
}
