# Currency Swap Form

A modern, interactive currency swap interface built with vanilla JavaScript, featuring real-time price data, token selection, and a polished user experience.

## 🚀 Features

### Core Functionality
- **Token Selection**: Interactive modal with search functionality
- **Real-time Price Data**: Fetches live prices from Switcheo API
- **Amount Calculation**: Automatic conversion with slippage tolerance
- **Swap Animation**: Smooth token swapping with visual feedback
- **Form Validation**: Input validation with helpful error messages

### Enhanced UX/UI
- **Modern Design**: Glass-morphism effects with gradient backgrounds
- **Responsive Layout**: Mobile-first design that works on all devices
- **Token Icons**: Integrates with Switcheo token icons repository
- **Loading States**: Smooth loading indicators and transitions
- **Accessibility**: Keyboard navigation and ARIA compliance
- **Settings Panel**: Configurable slippage tolerance and transaction deadline

### Technical Features
- **Vite Integration**: Fast development server and optimized builds
- **Service Worker**: Offline functionality and caching
- **Performance Monitoring**: Built-in performance tracking
- **Error Handling**: Comprehensive error handling and user feedback
- **Mock Backend**: Simulated swap transactions with realistic delays

## 🛠️ Technologies Used

- **Vanilla JavaScript (ES6+)**: Modern JavaScript with classes and async/await
- **CSS3**: Advanced styling with CSS Grid, Flexbox, and CSS Custom Properties
- **Vite**: Modern build tool for fast development and optimized production builds
- **Font Awesome**: Icons for enhanced visual appeal
- **Google Fonts (Inter)**: Clean, modern typography
- **Switcheo APIs**: Real token price data and icon assets

## 📦 Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Preview production build**:
5. **Run unit tests**:
   ```bash
   npm run test
   # or watch mode
   npm run test:watch
   ```
   ```bash
   npm run preview
   ```

## 🎨 Design Philosophy

The design follows modern web standards with emphasis on:

- **User Experience**: Intuitive interface with clear visual hierarchy
- **Performance**: Optimized loading and smooth animations
- **Accessibility**: Keyboard navigation and screen reader support
- **Mobile-First**: Responsive design that works across all devices
- **Visual Appeal**: Modern glass-morphism design with smooth animations

## 📱 Key Components

### Token Selection Modal
- Search functionality with real-time filtering
- Token icons from Switcheo repository
- Price display for each token
- Keyboard navigation support

### Amount Input System
- Real-time USD value calculation
- MAX button for maximum balance
- Input validation and error handling
- Automatic formatting for different number ranges

### Settings Panel
- Slippage tolerance configuration (0.1%, 0.5%, 1.0%, or custom)
- Transaction deadline setting
- Persistent settings across sessions

### Swap Interface
- Visual token swapping with animation
- Price impact calculation and display
- Network fee estimation
- Exchange rate information

## 🔧 Configuration

The app includes several configurable aspects:

- **Slippage Tolerance**: Default 0.5%, customizable in settings
- **Transaction Deadline**: Default 20 minutes
- **Token List**: Filtered to only show tokens with available price data
- **Mock Balances**: Realistic balance simulation for demo purposes

## 📊 Data Sources

- **Token Prices**: [Switcheo Prices API](https://interview.switcheo.com/prices.json)
- **Token Icons**: [Switcheo Token Icons Repository](https://github.com/Switcheo/token-icons)
- **Token Metadata**: Curated list with decimals and display names

## 🚀 Performance Optimizations

- **Lazy Loading**: Token icons loaded on demand
- **Debounced Search**: Optimized search input handling
- **Efficient Rendering**: Minimal DOM manipulation
- **Service Worker**: Offline caching for core assets
- **Code Splitting**: Optimized bundle sizes with Vite

## 🔒 Error Handling

Comprehensive error handling for:
- Network failures when loading price data
- Invalid user inputs (insufficient balance, minimum amounts)
- Token selection edge cases
- API timeout scenarios
- Offline functionality

## 📱 Responsive Design

The interface adapts to different screen sizes:
- **Desktop**: Full feature set with optimal spacing
- **Tablet**: Adjusted layout with touch-friendly interactions
- **Mobile**: Stacked layout with optimized input methods

## 🎯 Future Enhancements

Potential improvements for production use:
- Real wallet integration (MetaMask, WalletConnect)
- Advanced trading features (limit orders, stop-loss)
- Portfolio tracking and transaction history
- Multi-chain support
- DeFi protocol integration
- Advanced charting and analytics

## 📄 License

MIT License - feel free to use this project as a reference or starting point for your own implementations.

## 🤝 Contributing

This is a demonstration project for the Switcheo interview process. The code is provided as-is for evaluation purposes.

---

Built with ❤️ using modern web technologies and best practices.
