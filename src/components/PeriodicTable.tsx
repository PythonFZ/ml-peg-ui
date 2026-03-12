'use client';

import { useTheme } from '@mui/material/styles';
import { useColorScheme } from '@mui/material/styles';
import Box from '@mui/material/Box';

// [symbol, col, row] — standard 18-column periodic table layout
// Lanthanides on row 9, actinides on row 10 (with gap indicator at row 6-7)
const ELEMENTS: [string, number, number][] = [
  // Row 1
  ['H',  1,  1], ['He', 18,  1],
  // Row 2
  ['Li', 1,  2], ['Be', 2,  2],
  ['B',  13, 2], ['C',  14, 2], ['N',  15, 2], ['O',  16, 2], ['F',  17, 2], ['Ne', 18, 2],
  // Row 3
  ['Na', 1,  3], ['Mg', 2,  3],
  ['Al', 13, 3], ['Si', 14, 3], ['P',  15, 3], ['S',  16, 3], ['Cl', 17, 3], ['Ar', 18, 3],
  // Row 4
  ['K',  1,  4], ['Ca', 2,  4],
  ['Sc', 3,  4], ['Ti', 4,  4], ['V',  5,  4], ['Cr', 6,  4], ['Mn', 7,  4],
  ['Fe', 8,  4], ['Co', 9,  4], ['Ni', 10, 4], ['Cu', 11, 4], ['Zn', 12, 4],
  ['Ga', 13, 4], ['Ge', 14, 4], ['As', 15, 4], ['Se', 16, 4], ['Br', 17, 4], ['Kr', 18, 4],
  // Row 5
  ['Rb', 1,  5], ['Sr', 2,  5],
  ['Y',  3,  5], ['Zr', 4,  5], ['Nb', 5,  5], ['Mo', 6,  5], ['Tc', 7,  5],
  ['Ru', 8,  5], ['Rh', 9,  5], ['Pd', 10, 5], ['Ag', 11, 5], ['Cd', 12, 5],
  ['In', 13, 5], ['Sn', 14, 5], ['Sb', 15, 5], ['Te', 16, 5], ['I',  17, 5], ['Xe', 18, 5],
  // Row 6 (La placeholder col 3, then Hf-Rn)
  ['Cs', 1,  6], ['Ba', 2,  6], ['La', 3,  6],
  ['Hf', 4,  6], ['Ta', 5,  6], ['W',  6,  6], ['Re', 7,  6],
  ['Os', 8,  6], ['Ir', 9,  6], ['Pt', 10, 6], ['Au', 11, 6], ['Hg', 12, 6],
  ['Tl', 13, 6], ['Pb', 14, 6], ['Bi', 15, 6], ['Po', 16, 6], ['At', 17, 6], ['Rn', 18, 6],
  // Row 7 (Ac placeholder col 3, then Rf-Og)
  ['Fr', 1,  7], ['Ra', 2,  7], ['Ac', 3,  7],
  ['Rf', 4,  7], ['Db', 5,  7], ['Sg', 6,  7], ['Bh', 7,  7],
  ['Hs', 8,  7], ['Mt', 9,  7], ['Ds', 10, 7], ['Rg', 11, 7], ['Cn', 12, 7],
  ['Nh', 13, 7], ['Fl', 14, 7], ['Mc', 15, 7], ['Lv', 16, 7], ['Ts', 17, 7], ['Og', 18, 7],
  // Row 9: Lanthanides (Ce-Lu, cols 4-17)
  ['Ce', 4,  9], ['Pr', 5,  9], ['Nd', 6,  9], ['Pm', 7,  9], ['Sm', 8,  9],
  ['Eu', 9,  9], ['Gd', 10, 9], ['Tb', 11, 9], ['Dy', 12, 9], ['Ho', 13, 9],
  ['Er', 14, 9], ['Tm', 15, 9], ['Yb', 16, 9], ['Lu', 17, 9],
  // Row 10: Actinides (Th-Lr, cols 4-17)
  ['Th', 4,  10], ['Pa', 5,  10], ['U',  6,  10], ['Np', 7,  10], ['Pu', 8,  10],
  ['Am', 9,  10], ['Cm', 10, 10], ['Bk', 11, 10], ['Cf', 12, 10], ['Es', 13, 10],
  ['Fm', 14, 10], ['Md', 15, 10], ['No', 16, 10], ['Lr', 17, 10],
];

interface PeriodicTableProps {
  availablePairs: Record<string, string[]>;
  selectedElement1: string | null;
  selectedElement2: string | null;
  onSelectElement: (symbol: string) => void;
}

export default function PeriodicTable({
  availablePairs,
  selectedElement1,
  selectedElement2,
  onSelectElement,
}: PeriodicTableProps) {
  const theme = useTheme();
  const { mode } = useColorScheme();
  const isDark = mode === 'dark';

  // Build set of all elements that appear in any pair
  const allPairKeys = Object.keys(availablePairs);
  const allAvailableElements = new Set<string>();
  for (const key of allPairKeys) {
    const parts = key.split('-');
    if (parts.length >= 2) {
      allAvailableElements.add(parts[0]);
      allAvailableElements.add(parts.slice(1).join('-'));
    }
  }

  // When element1 selected, compute valid partners (including itself for homonuclear)
  const validPartners = new Set<string>();
  if (selectedElement1) {
    for (const key of allPairKeys) {
      const parts = key.split('-');
      if (parts.length >= 2) {
        const a = parts[0];
        const b = parts.slice(1).join('-');
        if (a === selectedElement1) validPartners.add(b);
        else if (b === selectedElement1) validPartners.add(a);
      }
    }
    // Include self if homonuclear pair exists
    const homoPair = `${selectedElement1}-${selectedElement1}`;
    if (allPairKeys.includes(homoPair)) {
      validPartners.add(selectedElement1);
    }
  }

  const bgDefault = isDark ? '#1e1e1e' : '#f5f5f5';
  const bgEnabled = isDark ? '#2d3748' : '#e3f2fd';
  const bgSelected = isDark ? '#1565c0' : '#1976d2';
  const bgDisabled = isDark ? '#111' : '#eee';
  const colorEnabled = isDark ? '#e0e0e0' : '#212121';
  const colorSelected = '#ffffff';
  const colorDisabled = isDark ? '#444' : '#bdbdbd';
  const borderSelected = `2px solid ${theme.palette.primary.main}`;
  const borderDefault = `1px solid ${isDark ? '#333' : '#ccc'}`;

  return (
    <Box
      sx={{
        width: '100%',
        overflowX: 'auto',
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(18, minmax(28px, 1fr))',
          gridTemplateRows: 'repeat(10, minmax(28px, auto))',
          gap: '2px',
          minWidth: '560px',
          width: '100%',
        }}
      >
        {ELEMENTS.map(([symbol, col, row]) => {
          const isDisabled = !allAvailableElements.has(symbol);
          const isSelected =
            symbol === selectedElement1 || symbol === selectedElement2;
          const isEnabled =
            !isDisabled &&
            (!selectedElement1 || validPartners.has(symbol) || symbol === selectedElement1);

          let bg = bgDefault;
          let color = colorEnabled;
          let border = borderDefault;
          let cursor = 'default';

          if (isSelected) {
            bg = bgSelected;
            color = colorSelected;
            border = borderSelected;
            cursor = 'pointer';
          } else if (isDisabled) {
            bg = bgDisabled;
            color = colorDisabled;
          } else if (isEnabled) {
            bg = bgEnabled;
            cursor = 'pointer';
          } else {
            // Grayed out — element1 selected but not a valid partner
            bg = bgDisabled;
            color = colorDisabled;
          }

          return (
            <Box
              key={symbol}
              component="button"
              disabled={isDisabled || (!isEnabled && !isSelected)}
              onClick={() => {
                if (!isDisabled && (isEnabled || isSelected)) {
                  onSelectElement(symbol);
                }
              }}
              sx={{
                gridColumn: col,
                gridRow: row,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: bg,
                color,
                border,
                borderRadius: '3px',
                fontSize: { xs: '9px', sm: '10px', md: '11px' },
                fontWeight: isSelected ? 700 : 500,
                fontFamily: 'inherit',
                cursor,
                padding: '2px 0',
                minHeight: '28px',
                transition: 'background-color 0.15s, color 0.15s',
                '&:hover:not(:disabled)': {
                  backgroundColor:
                    isSelected
                      ? isDark ? '#1976d2' : '#1565c0'
                      : isDark ? '#374151' : '#bbdefb',
                  borderColor: theme.palette.primary.main,
                },
                '&:disabled': {
                  cursor: 'not-allowed',
                },
              }}
              aria-label={symbol}
              aria-pressed={isSelected}
            >
              {symbol}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
