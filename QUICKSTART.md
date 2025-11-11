# 🚀 Quick Start Guide - AIOps RCA

## Get Started in 3 Minutes

### 1. Clone & Setup
```bash
git clone https://github.com/hpandya-atlassian/serv-co-ops-skunk-works.git
cd serv-co-ops-skunk-works
./setup.sh
```

### 2. Run the App
```bash
npm run dev
```

### 3. Open Browser
Navigate to `http://localhost:5173`

## 🎯 What You'll See

### Alerts Page
- **Real-time anomaly detection** with P0/P1/P2/P3 priorities
- **Interactive anomaly rows** - click to see detailed side panels
- **Correlated data visualization** across multiple sources
- **Automated alert workflows** with acknowledgment

### RCA Page
- **AI-powered hypothesis generation** with confidence scores
- **Interactive workflow builder** using XYFlow
- **Real-time data correlation** with CPU usage and error logs
- **Professional enterprise UI** with Atlassian design

### Workflow Builder
- **Drag-and-drop workflow creation**
- **Status-based workflow execution** (pending, active, completed)
- **Animated workflow flows** with labeled branches
- **Professional workflow icons** and enterprise styling

## 🔧 Troubleshooting

### Node.js Issues
```bash
# Check Node.js version (needs v18+)
node -v

# If using nvm
nvm use 18
npm install
```

### Port Already in Use
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or use different port
npm run dev -- --port 3000
```

### Dependencies Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## 📚 Next Steps

1. **Explore the alerts page** - click on anomaly rows
2. **Navigate to RCA** - click "Confirm hypothesis"
3. **Try the workflow builder** - drag and drop nodes
4. **Check the side panels** - detailed alert information

## 🆘 Need Help?

- **README.md** - Complete documentation
- **GitHub Issues** - Report bugs or request features
- **Discussions** - Ask questions or share ideas

---

**Built with ❤️ for the AIOps community**
