import React, { useState, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import SavingsPlanner from './pages/SavingsPlanner';

const App = () => {
  const [mode, setMode] = useState('light');

  const toggleMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'light' ? '#1976d2' : '#90caf9',
          },
          secondary: {
            main: mode === 'light' ? '#dc004e' : '#f48fb1',
          },
          background: {
            default: mode === 'light' ? '#f5f5f5' : '#121212',
            paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
          },
        },
        typography: {
          fontFamily: [
            'Roboto',
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Arial',
            'sans-serif'
          ].join(','),
          fontSize: 18,
          h1: {
            fontSize: '2.5rem',
            fontWeight: 500,
            '@media (max-width:600px)': {
              fontSize: '2rem',
            },
          },
          h2: {
            fontSize: '2.2rem',
            fontWeight: 500,
            '@media (max-width:600px)': {
              fontSize: '1.8rem',
            },
          },
          h3: {
            fontSize: '2rem',
            fontWeight: 500,
            '@media (max-width:600px)': {
              fontSize: '1.6rem',
            },
          },
          h4: {
            fontSize: '1.8rem',
            fontWeight: 500,
            '@media (max-width:600px)': {
              fontSize: '1.4rem',
            },
          },
          h5: {
            fontSize: '1.6rem',
            fontWeight: 500,
            '@media (max-width:600px)': {
              fontSize: '1.2rem',
            },
          },
          h6: {
            fontSize: '1.4rem',
            fontWeight: 500,
            '@media (max-width:600px)': {
              fontSize: '1.1rem',
            },
          },
          body1: {
            fontSize: '1.8rem',
            '@media (max-width:600px)': {
              fontSize: '1.6rem',
            },
          },
          body2: {
            fontSize: '1.6rem',
            '@media (max-width:600px)': {
              fontSize: '1.4rem',
            },
          },
          button: {
            fontSize: '1.6rem',
            fontWeight: 500,
            '@media (max-width:600px)': {
              fontSize: '1.4rem',
            },
          },
          caption: {
            fontSize: '1.4rem',
            '@media (max-width:600px)': {
              fontSize: '1.2rem',
            },
          },
        },
        components: {
          MuiTableCell: {
            styleOverrides: {
              root: {
                fontSize: '1.6rem',
                padding: '16px 20px',
                '@media (max-width:600px)': {
                  fontSize: '1.4rem',
                  padding: '12px 16px',
                },
              },
              head: {
                fontSize: '1.6rem',
                fontWeight: 700,
                padding: '18px 20px',
                '@media (max-width:600px)': {
                  fontSize: '1.4rem',
                  padding: '14px 16px',
                },
              },
            },
          },
          MuiInputBase: {
            styleOverrides: {
              root: {
                fontSize: '1.6rem',
                '@media (max-width:600px)': {
                  fontSize: '1.4rem',
                },
              },
            },
          },
          MuiInputLabel: {
            styleOverrides: {
              root: {
                fontSize: '1.6rem',
                '@media (max-width:600px)': {
                  fontSize: '1.4rem',
                },
              },
            },
          },
          MuiMenuItem: {
            styleOverrides: {
              root: {
                fontSize: '1.6rem',
                '@media (max-width:600px)': {
                  fontSize: '1.4rem',
                },
              },
            },
          },
          MuiTooltip: {
            styleOverrides: {
              tooltip: {
                fontSize: '1.4rem',
                padding: '12px 16px',
                '@media (max-width:600px)': {
                  fontSize: '1.2rem',
                  padding: '10px 14px',
                },
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              label: {
                fontSize: '1.4rem',
                '@media (max-width:600px)': {
                  fontSize: '1.2rem',
                },
              },
            },
          },
          MuiTab: {
            styleOverrides: {
              root: {
                fontSize: '1.6rem',
                '@media (max-width:600px)': {
                  fontSize: '1.4rem',
                },
              }
            }
          },
          MuiFormHelperText: {
            styleOverrides: {
              root: {
                fontSize: '1.3rem',
                '@media (max-width:600px)': {
                  fontSize: '1.1rem',
                },
              }
            }
          },
          MuiSelect: {
            styleOverrides: {
              select: {
                fontSize: '1.6rem',
                '@media (max-width:600px)': {
                  fontSize: '1.4rem',
                },
              }
            }
          },
          MuiButton: {
            styleOverrides: {
              root: {
                fontSize: '1.5rem',
                '@media (max-width:600px)': {
                  fontSize: '1.3rem',
                },
              }
            }
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        <SavingsPlanner themeMode={mode} toggleTheme={toggleMode} />
      </div>
    </ThemeProvider>
  );
};

export default App;
