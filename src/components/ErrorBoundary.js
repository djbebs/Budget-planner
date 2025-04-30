import React from 'react';
import { Paper, Typography, Button } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    // Log the error to your error reporting service
    console.error('Application error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            m: 4, 
            maxWidth: 600, 
            mx: 'auto',
            textAlign: 'center' 
          }}
        >
          <Typography variant="h5" color="error" gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body1" paragraph>
            We apologize for the inconvenience. Please try reloading the page.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={this.handleReload}
            sx={{ mt: 2 }}
          >
            Reload Page
          </Button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div style={{ marginTop: 20, textAlign: 'left' }}>
              <Typography variant="body2" color="error">
                {this.state.error.toString()}
              </Typography>
              <pre style={{ 
                marginTop: 10, 
                padding: 10, 
                backgroundColor: '#f5f5f5',
                overflow: 'auto' 
              }}>
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>
          )}
        </Paper>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 