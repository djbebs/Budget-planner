# Budget Planner

A comprehensive financial planning application built with React and Material-UI that helps users manage their savings and expenses effectively.

## Features

- **Monthly Savings Calculator**: Automatically calculates the required monthly savings based on your expenses
- **Expense Management**:
  - Add, edit, and delete expenses
  - Categorize expenses (Tax, Mortgage, Insurance, Cars, Education, Utility bills)
  - Support for different payment frequencies (Monthly, Annual, One-off, Irregular)
  - Custom payment schedules for irregular expenses
- **Visual Analytics**:
  - Interactive savings chart
  - Detailed monthly calculation breakdown
- **Data Management**:
  - Import/Export expenses via CSV
  - Persistent storage of financial data

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/djbebs/Budget-planner.git
cd Budget-planner
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm start
# or
yarn start
```

The application will be available at `http://localhost:3000`.

## Usage

1. **Setting Current Savings**:
   - Enter your current savings amount in the top section

2. **Managing Expenses**:
   - Click "Add Expense" to create new expenses
   - Use the table to view and manage existing expenses
   - Edit or delete expenses using the action buttons

3. **Importing/Exporting Data**:
   - Use the "Import CSV" button to import expense data
   - Use the "Export CSV" button to export your current expenses

4. **Viewing Calculations**:
   - The monthly savings needed is displayed at the top
   - View detailed monthly calculations by expanding the "Monthly Calculation Details" section
   - Check the savings chart for visual representation of your financial plan

## CSV Import Format

The application accepts CSV files with the following columns:
- Category
- Subcategory
- Description
- Amount
- Recurrence
- Payment Schedule
- End Date

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Your Name - [@djbebs](https://github.com/djbebs)

Project Link: [https://github.com/djbebs/Budget-planner](https://github.com/djbebs/Budget-planner) 