import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  Grid,
} from '@mui/material';
import { useFinancial } from '../context/FinancialContext';

function IncomeTracker() {
  const { state, dispatch } = useFinancial();
  const [income, setIncome] = useState({
    person: '',
    source: '',
    frequency: 'Monthly',
    amount: '',
    startDate: '',
    endDate: '',
    notes: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setIncome((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newIncome = {
      ...income,
      id: Date.now(),
      amount: parseFloat(income.amount),
    };
    dispatch({ type: 'ADD_INCOME', payload: newIncome });
    setIncome({
      person: '',
      source: '',
      frequency: 'Monthly',
      amount: '',
      startDate: '',
      endDate: '',
      notes: '',
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Income Tracker
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Person"
                name="person"
                value={income.person}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Source"
                name="source"
                value={income.source}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Frequency"
                name="frequency"
                value={income.frequency}
                onChange={handleChange}
                required
              >
                <MenuItem value="Monthly">Monthly</MenuItem>
                <MenuItem value="1 off">One-time</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount"
                name="amount"
                type="number"
                value={income.amount}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                name="startDate"
                type="date"
                value={income.startDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                name="endDate"
                type="date"
                value={income.endDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={income.notes}
                onChange={handleChange}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary">
                Add Income
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Person</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Frequency</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {state.income.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.person}</TableCell>
                <TableCell>{item.source}</TableCell>
                <TableCell>{item.frequency}</TableCell>
                <TableCell>{item.amount.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'CHF',
                })}</TableCell>
                <TableCell>{item.startDate}</TableCell>
                <TableCell>{item.endDate}</TableCell>
                <TableCell>{item.notes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default IncomeTracker; 