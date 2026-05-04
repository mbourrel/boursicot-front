import { useProfile } from '../context/ProfileContext';
import { useFundamentals } from '../hooks/useFundamentals';
import { useSectorAverages } from '../hooks/useSectorAverages';
import { useSectorHistory } from '../hooks/useSectorHistory';
import FundamentalsSkeleton from './fundamentals/FundamentalsSkeleton';
import SoloView from './fundamentals/SoloView';
import ComparisonView from './fundamentals/ComparisonView';

function Fundamentals({ selectedSymbol, compareSymbols = [] }) {
  const { profile } = useProfile();
  const isExplorateur = profile === 'explorateur';
  const allSymbols = [selectedSymbol, ...compareSymbols];
  const { dataMap, loading, errors } = useFundamentals(allSymbols);
  const isSoloMode = allSymbols.length === 1;
  const primarySector = isSoloMode ? dataMap[selectedSymbol]?.sector : null;
  const sectorAvg     = useSectorAverages(primarySector);
  // useSectorHistory est coûteux — réservé au profil Stratège
  const sectorHistory = useSectorHistory(isExplorateur ? null : primarySector);

  if (loading) return <FundamentalsSkeleton />;

  if (isSoloMode) {
    return (
      <SoloView
        selectedSymbol={selectedSymbol}
        data={dataMap[selectedSymbol]}
        error={errors[selectedSymbol]}
        sectorAvg={sectorAvg}
        sectorHistory={sectorHistory}
      />
    );
  }

  return <ComparisonView allSymbols={allSymbols} dataMap={dataMap} />;
}

export default Fundamentals;
