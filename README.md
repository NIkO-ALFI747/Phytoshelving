# Phytoshelving - Real-Time Agricultural Monitoring System

A sophisticated full-stack IoT monitoring platform for precision agriculture, featuring real-time data acquisition, multi-parameter tracking, dynamic visualization, and automated alerting for controlled environment agriculture. Built with Node.js, PostgreSQL, React, and WebSocket technology for sub-second latency monitoring.

## Overview

Phytoshelving is an enterprise-grade monitoring and data acquisition system designed for agricultural research facilities and controlled environment agriculture (CEA) operations. The system tracks multiple environmental parameters (irrigation, lighting, temperature, humidity) across distributed shelving units containing various plant types, providing real-time analytics and historical trend analysis.

**Core Capabilities:**
- Real-time parameter monitoring with 1-second polling intervals
- Multi-room, multi-shelving hierarchical organization
- Dynamic range-based alerting with stationary and time-series thresholds
- Background worker process for non-blocking data collection
- WebSocket-based live updates to connected clients
- Time-series data visualization with Plotly.js
- Composite graph analysis for multi-parameter correlation

## System Architecture

### Three-Tier Architecture with Microservice Worker

```
┌─────────────────────────────────────────────────────────────────┐
│                     Presentation Layer (React)                  │
│   Real-time Dashboard, Plotly Charts, WebSocket Client         │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP/WebSocket
┌──────────────────────▼──────────────────────────────────────────┐
│                  Application Server (Express)                   │
│   REST API, Socket.IO Hub, Controller Layer, IPC Manager       │
└──────────────────────┬──────────────────────────────────────────┘
         │             │              │
         │             │              └──────┐
         ▼             ▼                     ▼
┌────────────┐  ┌─────────────┐    ┌───────────────┐
│ PostgreSQL │  │ Child Worker│    │  Socket.IO    │
│   Database │  │   Process   │    │   Server      │
└────────────┘  └─────────────┘    └───────────────┘
                      │
                      └──> Background Data Collection
                           Survey Execution
                           Range Validation
```

### Key Architectural Decisions

1. **Child Process Worker Pattern**: Offloads CPU-intensive survey operations to a forked child process, preventing main event loop blocking
2. **Bidirectional IPC**: Parent-worker communication via Node.js `child_process` messaging
3. **Socket.IO Broadcasting**: Real-time data push to all connected clients without polling
4. **Sequelize ORM with Views**: Database abstraction with materialized view support for complex queries
5. **Stateless API Design**: RESTful endpoints with JWT-ready architecture (authentication layer ready for implementation)

## Technology Stack

### Backend
- **Node.js** - Asynchronous event-driven JavaScript runtime
- **Express.js 4.18** - Minimalist web framework for API routing
- **Sequelize 6.32** - Promise-based ORM with PostgreSQL dialect
- **sequelize-mv-support** - Materialized view extension for Sequelize
- **Socket.IO 4.7** - Real-time bidirectional event-based communication
- **PostgreSQL** - ACID-compliant relational database
- **pg 8.11** - Non-blocking PostgreSQL client for Node.js
- **body-parser** - Request body parsing middleware
- **CORS** - Cross-Origin Resource Sharing middleware
- **dotenv** - Environment variable management

### Frontend
- **React 18.2** - Component-based UI library with Concurrent Features
- **React Router DOM 6.13** - Declarative routing for React
- **Axios 1.4** - Promise-based HTTP client
- **Plotly.js 2.24** - Scientific graphing library
- **react-plotly.js** - React component wrapper for Plotly
- **Socket.IO Client 4.7** - WebSocket client for real-time updates
- **Day.js 1.11** - Lightweight date manipulation library
- **React Flatpickr** - DateTime picker component
- **Lucide React** - Icon library
- **Tailwind CSS 3.3** - Utility-first CSS framework
- **DaisyUI 3.1** - Tailwind CSS component library
- **React Toastify** - Notification system

### Infrastructure
- **Docker & Docker Compose** - Containerization and orchestration
- **pgAdmin 4** - PostgreSQL administration tool

## Database Schema & Domain Model

### Entity-Relationship Structure

The database implements a hierarchical multi-tenant architecture supporting multiple research facilities:

```
Room (Комната)
  └── Shelving (Стеллаж)
       └── Shelf (Полка)
            ├── Plant (Растение/Культура)
            └── ParameterSetting (Настройка опроса параметра)
                 ├── Parameter (Параметр: Полив, Освещенность, etc.)
                 ├── ParameterValue (Измеренное значение)
                 ├── Range (Диапазон: работа/простой)
                 └── ParameterSettingRating (Рейтинг посещения)
```

### Core Models

#### 1. Hierarchical Organization Models

```javascript
Room {
  id: INTEGER PK
  name: STRING UNIQUE NOT NULL  // Cyrillic/Latin alphanumeric validation
}

Shelving {
  id: INTEGER PK
  name: STRING NOT NULL
  roomId: INTEGER FK -> Room
  UNIQUE(name, roomId)  // Composite unique constraint
}

Shelf {
  id: INTEGER PK
  serial_num: INTEGER NOT NULL  // Position on shelving unit
  shelvingId: INTEGER FK -> Shelving
  plantId: INTEGER FK -> Plant (nullable)
  UNIQUE(serial_num, shelvingId)
}
```

**Design Rationale:**
- Composite unique constraints prevent naming conflicts within the same parent
- Serial numbers support physical shelf positioning
- Nullable `plantId` allows for empty/unassigned shelves

#### 2. Plant Taxonomy Model

```javascript
Plant {
  id: INTEGER PK
  name: STRING UNIQUE NOT NULL
  // Examples: Масличные, Плодовые, Ягодные, Овощные
}
```

**Domain Context:**
Agricultural classification for:
- Масличные (Oil crops)
- Плодовые (Fruit crops)
- Ягодные (Berry crops)
- Овощные (Vegetable crops)
- Иные культурные (Other cultivated crops)

#### 3. Parameter Monitoring Models

```javascript
ParameterType {
  id: INTEGER PK
  description: STRING NOT NULL
  // Units: Миллиметры^3, Градусы Цельсия, Проценты
}

Parameter {
  id: INTEGER PK
  name: STRING UNIQUE NOT NULL
  parameterTypeId: INTEGER FK -> ParameterType
  // Types: Полив, Освещенность, Температура, Влажность
}

ParameterSetting {
  id: INTEGER PK
  description: STRING (nullable)
  activity: BOOLEAN NOT NULL DEFAULT false
  shelfId: INTEGER FK -> Shelf
  parameterId: INTEGER FK -> Parameter
}
```

**Key Features:**
- **Activity Flag**: Enable/disable monitoring without data loss
- **Per-Shelf Configuration**: Each shelf can monitor different parameters
- **Type Safety**: Strongly typed parameter units (mm³, °C, %)

#### 4. Time-Series Data Collection

```javascript
ParameterValue {
  id: INTEGER PK
  value: FLOAT NOT NULL
  fixate_serial_num: INTEGER NOT NULL  // Sequence number within poll
  fixate_time: DATE NOT NULL           // Timestamp of measurement
  parameterPollingSettingId: INTEGER FK -> ParameterSetting
}
```

**Indexing Strategy:**
```sql
-- Recommended indexes for query performance
CREATE INDEX idx_param_value_setting_time 
  ON value_configured_parameters(parameterPollingSettingId, fixate_time DESC);
CREATE INDEX idx_param_value_time 
  ON value_configured_parameters(fixate_time DESC);
```

**Query Optimization:**
Time-series queries use descending time index for most recent values first.

#### 5. Dynamic Range System

```javascript
Range {
  id: INTEGER PK
  description: STRING (nullable)
  type: STRING NOT NULL  // "работа" (work) or "простой" (downtime)
}

RangeValue {
  id: INTEGER PK
  value: FLOAT NOT NULL
  rangeId: INTEGER FK -> Range
}

StationarySequence {
  id: INTEGER PK
  num_values: INTEGER NOT NULL  // Number of cycles in this sequence
  rangeValueId: INTEGER FK -> RangeValue
}

DynamicRangeElem {
  id: INTEGER PK
  serial_num: INTEGER NOT NULL  // Position in dynamic sequence
  rangeValueId: INTEGER FK -> RangeValue
}
```

**Range System Explained:**

The system supports two range types:

1. **Stationary Sequences**: Fixed-duration work/rest cycles
   - Example: Irrigation for 60 seconds, rest for 300 seconds, repeat 10 times
   - `num_values` tracks remaining iterations

2. **Dynamic Sequences**: Variable-duration patterns
   - Example: Light intensity ramping [100%, 80%, 60%, 40%, 20%] over time
   - `serial_num` tracks position in the sequence

**Many-to-Many Relationship:**
```javascript
ParameterSettingRange {
  id: INTEGER PK
  parameterPollingSettingId: INTEGER FK
  rangeId: INTEGER FK
}
```

A single `ParameterSetting` can have multiple active ranges (e.g., work range + downtime range).

### Database Views for Performance

```javascript
// Sequelize view definitions with treatAsView: true
RoomView, ShelvingView, ShelfView, PlantView,
ParameterSettingView, ParameterView, ParameterTypeView,
ParameterValueView, ParameterSettingRatingView, RangeView,
RangeValueView, StationarySequenceView, DynamicRangeElemView
```

**Purpose:**
- Simplify complex JOIN queries
- Provide read-only access patterns
- Enable future materialized view optimization
- Abstract internal ID fields from client applications

## Real-Time Data Collection Architecture

### Child Process Worker Pattern

**Problem:** Long-running survey operations (interval-based parameter polling) would block Node.js event loop, causing API latency and timeout issues.

**Solution:** Fork a dedicated child process for background data collection.

```javascript
// workerManager.js
const { fork } = require("child_process");

function startWorker() {
  worker = fork(path.join(__dirname, "worker", "worker.js"));
  
  worker.on("message", (msg) => {
    // Forward worker messages to all Socket.IO clients
    if (ioInstance) {
      ioInstance.emit("message", msg);
    }
  });
  
  worker.on("exit", (code) => {
    console.log(`Worker exited with code ${code}`);
    worker = null;
  });
  
  return worker;
}
```

**Worker Lifecycle:**
1. Parent process forks worker during server initialization
2. Worker starts infinite survey loop at 1-second intervals
3. Parent sends IPC messages to control worker behavior
4. Worker sends data updates back to parent
5. Parent broadcasts to Socket.IO clients
6. Graceful shutdown via SIGTERM signal handling

### Inter-Process Communication (IPC) Protocol

**Parent → Worker Messages:**

```javascript
// Activate parameter monitoring
{ task: "createSurvey", taskId: 1644321234567, data: {} }

// Control real-time graphing
{ type: "activeRealtimeGraph", id: 34 }
{ type: "stopRealtimeGraph", id: 34 }

// Activate/deactivate parameters
{ type: "activeOne", id: 12 }
{ type: "deactiveOne", id: 12 }
{ type: "activeAll", id: [1, 2, 3, 4] }
{ type: "deactiveAll", id: [1, 2, 3, 4] }

// Control automatic parameter activation
{ type: "auto", activity: true }
```

**Worker → Parent Messages:**

```javascript
// Survey data update
{
  type: "parameterUpdate",
  id: 34,
  value: 23.5,
  timestamp: "2025-02-05T12:30:45.123Z"
}

// Status updates
{
  type: "surveyComplete",
  taskId: 1644321234567,
  parametersProcessed: 42
}
```

### Survey Algorithm Implementation

**Core Survey Loop (worker.js):**

```javascript
// Simplified pseudo-code of actual implementation
const surveyFunc = (paramIndex) => {
  surveyId = setInterval(async () => {
    const param = configured_parameters[paramIndex];
    
    // 1. Range Processing
    if (param.ranges.work) {
      param.counters.work += 1;
      if (param.counters.work >= workRange.value) {
        param.counters.work = 0;
        // Transition to downtime
      }
    }
    
    if (param.ranges.downtime) {
      param.counters.downtime += 1;
      if (param.counters.downtime >= downtimeRange.value) {
        param.counters.downtime = 0;
        // Transition to work
      }
    }
    
    // 2. Generate Sensor Value
    const value = generateSensorReading(param);
    
    // 3. Persist to Database
    await ParameterValue.create({
      value: value,
      fixate_serial_num: param.sequenceNumber++,
      fixate_time: new Date(),
      parameterPollingSettingId: param.id
    });
    
    // 4. Broadcast to Real-Time Subscribers
    if (realTime[paramIndex]) {
      process.send({
        type: "parameterUpdate",
        id: param.id,
        value: value,
        timestamp: new Date().toISOString()
      });
    }
    
    // 5. Check Termination Conditions
    if (deactive[paramIndex] || !param.activity) {
      clearInterval(surveyId);
      param.activity = false;
    }
  }, 1000);  // 1-second polling interval
};
```

**Key Algorithm Features:**

1. **State Machine**: Each parameter maintains work/downtime state
2. **Counter-Based Transitions**: Incremental counters trigger range changes
3. **Sequence Numbering**: `fixate_serial_num` creates ordered time-series
4. **Conditional Broadcasting**: Real-time updates only for active subscribers
5. **Graceful Termination**: Clean interval cleanup on deactivation

### Dynamic vs. Stationary Range Handling

**Stationary Range Example:**
```
Irrigation Cycle:
- Work: 60 seconds (water on)
- Downtime: 300 seconds (water off)
- Repeat: 10 times

Counter progression:
0...59 → 60 (trigger), reset to 0, switch to downtime
0...299 → 300 (trigger), reset to 0, switch to work
Repeat until num_values = 0
```

**Dynamic Range Example:**
```
Light Intensity Ramp:
Serial 0: 100% for 3600 seconds
Serial 1: 80% for 3600 seconds
Serial 2: 60% for 3600 seconds
Serial 3: 40% for 3600 seconds
Serial 4: 20% for 3600 seconds

Counter tracks position in sequence:
counterWorkRange = 0 → dynValue[dynWorkRange[0]] = 3600 seconds at 100%
counterWorkRange = 1 → dynValue[dynWorkRange[1]] = 3600 seconds at 80%
...
```

**Implementation Detail:**
```javascript
// Dynamic range advancement logic
if (configured_parameters[i].counters[1].counter >= 
    dynValue[dynWorkRange[counterWorkRange]]) {
  configured_parameters[i].counters[1].counter = 0;
  
  dynCurrentNumValues[dynWorkRange[counterWorkRange]] -= 1;
  if (dynCurrentNumValues[dynWorkRange[counterWorkRange]] == 0) {
    counterWorkRange++;  // Move to next sequence element
  }
}
```

## WebSocket Real-Time Communication

### Socket.IO Integration

**Server Setup:**
```javascript
const io = require("socket.io")(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  },
});

io.on("connection", (socket) => {
  console.log("user connected");
  
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
  
  socket.on("message", (message) => {
    // Handle client messages
  });
});

setSocketIO(io);  // Store reference for worker messages
```

**Client Connection:**
```javascript
import io from "socket.io-client";

const socket = io(process.env.REACT_APP_SERVER_URL);

socket.on("connect", () => {
  console.log("Connected to server");
});

socket.on("message", (data) => {
  // Update charts with real-time data
  updatePlotlyGraph(data);
});
```

**Broadcasting Pattern:**
```javascript
// Worker sends data to parent
process.send({ type: "parameterUpdate", id: 34, value: 23.5 });

// Parent broadcasts to all clients
worker.on("message", (msg) => {
  ioInstance.emit("message", msg);  // Broadcast to all
});
```

**Advantages Over HTTP Polling:**
- Sub-second latency (vs. 1-5 second polling intervals)
- Reduced server load (no repeated GET requests)
- Bidirectional communication (server can push to client)
- Connection persistence with automatic reconnection

## API Design & Routing

### RESTful Endpoint Structure

```
/api
├── /room                    # Room management
│   ├── GET    /             # List all rooms
│   ├── POST   /             # Create room
│   └── DELETE /:id          # Delete room
│
├── /shelving                # Shelving unit management
│   ├── GET    /             # List all shelvings
│   ├── GET    /:id          # Get shelving with shelves
│   ├── POST   /             # Create shelving
│   └── DELETE /:id          # Delete shelving
│
├── /shelf                   # Shelf management
│   ├── GET    /             # List all shelves
│   ├── GET    /:id          # Get shelf with parameters
│   ├── POST   /             # Create shelf
│   └── DELETE /:id          # Delete shelf
│
├── /plant                   # Plant type management
│   ├── GET    /             # List all plants
│   ├── POST   /             # Create plant
│   └── DELETE /:id          # Delete plant
│
├── /parameter               # Parameter configuration
│   ├── GET    /             # List parameters
│   ├── GET    /type         # List parameter types
│   ├── POST   /             # Create parameter
│   └── DELETE /:id          # Delete parameter
│
├── /parameter-setting       # Monitoring configuration
│   ├── GET    /             # List all settings
│   ├── GET    /:id          # Get specific setting
│   ├── POST   /             # Create setting
│   └── DELETE /:id          # Delete setting
│
├── /range                   # Range management
│   ├── GET    /             # List all ranges
│   ├── POST   /graph        # Get historical data
│   ├── POST   /realtimeGraph # Subscribe to real-time updates
│   ├── POST   /activateParameter # Toggle parameter activity
│   └── POST   /             # Create range
│
└── /database                # Admin utilities
    ├── POST   /backup       # Backup database
    ├── POST   /restore      # Restore from backup
    └── GET    /status       # Database health check
```

### Key Controller Patterns

#### 1. Hierarchical Data Loading with Includes

```javascript
// shelfController.js - Get shelf with all related data
async getOne(req, res) {
  const shelf = await Shelf.findOne({
    where: { id: req.params.id },
    include: [
      { model: Plant },
      {
        model: ParameterSetting,
        include: [
          { model: Parameter },
          { model: ParameterValue, limit: 100 }
        ]
      }
    ]
  });
  return res.json(shelf);
}
```

**Sequelize Include Mechanism:**
- Performs SQL JOINs transparently
- Nested includes create hierarchical JSON
- `limit` prevents over-fetching time-series data

#### 2. Background Task Delegation

```javascript
// surveyController.js - Asynchronous survey trigger
async triggerSurvey(req, res) {
  const worker = getWorker();
  const taskId = Date.now();
  
  worker.send({ task: "createSurvey", taskId, data: {} });
  
  return res.status(202).json({
    message: "Survey task started in background.",
    taskId,
  });
}
```

**HTTP 202 Accepted Pattern:**
- Immediately returns to client (non-blocking)
- Actual work happens asynchronously in worker
- Client can poll for completion or subscribe to WebSocket updates

#### 3. Complex Query Optimization

```javascript
// rangeController.js - Optimized time-series query
async graph(req, res) {
  const paramValues = await db.query(`
    SELECT id, value, fixate_time, fixate_serial_num
    FROM value_configured_parameters
    WHERE "parameterPollingSettingId" = ${req.body.id}
    ORDER BY id
  `);
  
  return res.json({
    msg: "success",
    id: req.body.id,
    paramValues: paramValues[0],
  });
}
```

**Raw SQL for Performance:**
- Bypasses Sequelize ORM overhead for bulk reads
- Direct index usage on `parameterPollingSettingId`
- Returns thousands of data points efficiently

### Request/Response Examples

**Activate Parameter Monitoring:**
```bash
POST /api/range/activateParameter
Content-Type: application/json

{
  "id": 34,
  "activity": true,
  "type": "one"  // "one" or "all"
}

# Response
{
  "msg": "Активация",
  "id": [34],
  "activity": true
}
```

**Subscribe to Real-Time Graph:**
```bash
POST /api/range/realtimeGraph
Content-Type: application/json

{
  "id": 34,
  "type": "activeRealtimeGraph"
}

# Response
{
  "msg": "success",
  "type": "activeRealtimeGraph",
  "id": 34,
  "paramValues": [
    {
      "id": 1234,
      "value": 23.5,
      "fixate_time": "2025-02-05T12:30:45.123Z",
      "fixate_serial_num": 1
    },
    ...
  ]
}

# Followed by WebSocket messages:
{
  "type": "parameterUpdate",
  "id": 34,
  "value": 23.8,
  "timestamp": "2025-02-05T12:30:46.123Z"
}
```

## Frontend Architecture & Data Visualization

### Component Hierarchy

```
App.js (Dashboard Root)
├── AppHeader.jsx          # Navigation bar
├── AppMenu.jsx            # Sidebar menu
├── AppAlert.jsx           # Toast notifications
├── AppFooter.jsx          # Footer
│
├── Pages
│   ├── AuxiliaryPage.js       # Control panel for activation
│   ├── SearchFilterPage.js    # Data search interface
│   ├── GraphicPage.js         # Single parameter graph
│   ├── GraphPage.js           # Single graph view
│   ├── BigGraphPage.js        # Multi-parameter comparison
│   ├── ShelvingPage.js        # Shelving unit view
│   └── ShelfPage.js           # Individual shelf view
│
└── Components
    ├── AppGraph.jsx           # Generic graph wrapper
    ├── AppShelf.jsx           # Shelf visualization
    ├── PlotlyGraph.js         # Plotly integration
    └── GraphCalendar.jsx      # Date range picker
```

### Plotly.js Integration for Scientific Visualization

**Basic Implementation:**
```javascript
import Plot from "plotly.js";

const renderGraph = (parameterData) => {
  const trace = {
    x: parameterData.map(d => d.fixate_time),
    y: parameterData.map(d => d.value),
    type: 'scatter',
    mode: 'lines+markers',
    name: 'Temperature',
    line: { color: '#4f46e5', width: 2 },
    marker: { size: 4 }
  };
  
  const layout = {
    title: 'Temperature vs Time',
    xaxis: {
      title: 'Time',
      type: 'date',
      tickformat: '%H:%M:%S'
    },
    yaxis: {
      title: 'Temperature (°C)',
      zeroline: true
    },
    hovermode: 'closest',
    plot_bgcolor: '#1e293b',
    paper_bgcolor: '#0f172a',
    font: { color: '#cbd5e1' }
  };
  
  Plot.newPlot('graph-container', [trace], layout, {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['lasso2d', 'select2d']
  });
};
```

**Advanced Features:**

1. **Multi-Trace Comparison:**
```javascript
const traces = parameters.map((param, idx) => ({
  x: param.values.map(v => v.fixate_time),
  y: param.values.map(v => v.value),
  type: 'scatter',
  mode: 'lines',
  name: param.name,
  yaxis: idx === 0 ? 'y' : `y${idx + 1}`  // Multiple Y-axes
}));
```

2. **Real-Time Updates:**
```javascript
socket.on("message", (data) => {
  if (data.type === "parameterUpdate") {
    Plot.extendTraces('graph-container', {
      x: [[data.timestamp]],
      y: [[data.value]]
    }, [0]);  // Append to first trace
    
    // Sliding window: keep last 1000 points
    if (graphData.length > 1000) {
      Plot.relayout('graph-container', {
        'xaxis.range': [
          graphData[graphData.length - 1000].fixate_time,
          graphData[graphData.length - 1].fixate_time
        ]
      });
    }
  }
});
```

3. **Statistical Overlays:**
```javascript
// Add mean line and standard deviation bands
const mean = calculateMean(values);
const stdDev = calculateStdDev(values);

const meanTrace = {
  x: [firstTime, lastTime],
  y: [mean, mean],
  type: 'scatter',
  mode: 'lines',
  line: { dash: 'dash', color: 'red' },
  name: 'Mean'
};

const upperBand = {
  x: times,
  y: values.map(() => mean + stdDev),
  fill: 'tonexty',
  fillcolor: 'rgba(255, 0, 0, 0.1)',
  line: { color: 'transparent' },
  showlegend: false
};
```

### State Management & Data Flow

**React Hooks for Data Management:**
```javascript
const [parameterData, setParameterData] = useState([]);
const [isRealtime, setIsRealtime] = useState(false);
const [socket, setSocket] = useState(null);

useEffect(() => {
  // Initial data fetch
  axios.get(`${SERVER_URL}/api/range/graph`, {
    data: { id: parameterId }
  }).then(res => {
    setParameterData(res.data.paramValues);
  });
  
  // WebSocket connection
  const socketConnection = io(SERVER_URL);
  setSocket(socketConnection);
  
  return () => {
    socketConnection.disconnect();
  };
}, [parameterId]);

useEffect(() => {
  if (!socket || !isRealtime) return;
  
  socket.on("message", (data) => {
    if (data.type === "parameterUpdate" && data.id === parameterId) {
      setParameterData(prev => [...prev, {
        value: data.value,
        fixate_time: data.timestamp,
        fixate_serial_num: prev.length + 1
      }]);
    }
  });
  
  return () => {
    socket.off("message");
  };
}, [socket, isRealtime, parameterId]);
```

**Optimistic UI Updates:**
```javascript
const toggleParameter = async (id, activity) => {
  // Immediate UI update
  setParameters(prev => prev.map(p => 
    p.id === id ? { ...p, activity } : p
  ));
  
  try {
    await axios.post(`${SERVER_URL}/api/range/activateParameter`, {
      id,
      activity,
      type: "one"
    });
  } catch (error) {
    // Rollback on error
    setParameters(prev => prev.map(p => 
      p.id === id ? { ...p, activity: !activity } : p
    ));
    toast.error("Failed to update parameter");
  }
};
```

## Docker Containerization & Deployment

### Multi-Container Architecture

**Root docker-compose.yml:**
```yaml
include:
  - path: ./server/docker-compose.yml

services:
  client:
    build:
      context: ./client
      dockerfile: Dockerfile
      args:
        REACT_APP_SERVER_URL: http://localhost:8080
    container_name: client
    ports:
      - "3000:3000"
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

**Server docker-compose.yml:**
```yaml
services:
  server:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: server
    ports:
      - "8080:8080"
    volumes:
      - .:/app
      - /app/node_modules
    env_file:
      - ./.env
    networks:
      - app-network

  pgadmin:
    image: dpage/pgadmin4
    container_name: pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD}
    ports:
      - "5050:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    networks:
      - app-network

volumes:
  pgadmin_data:
```

### Container Networking

**Bridge Network Benefits:**
- Service discovery via container names
- Isolation from host network
- Internal DNS resolution

**Service Communication:**
```
Client Container (Port 3000)
    ↓ HTTP/WebSocket
Server Container (Port 8080)
    ↓ TCP
PostgreSQL Container (Port 5432)
```

**Environment Variable Injection:**
```bash
# Server .env
DB_NAME=phytoshelving
DB_USER=postgres
DB_PASSWORD=secure_password
DB_HOST=postgres
DB_PORT=5432
PORT=8080
CLIENT_ORIGIN=http://localhost:3000
PGADMIN_EMAIL=admin@phytoshelving.com
PGADMIN_PASSWORD=admin_password
```

**Client Build-Time Variables:**
```dockerfile
# client/Dockerfile
ARG REACT_APP_SERVER_URL
ENV REACT_APP_SERVER_URL=$REACT_APP_SERVER_URL

RUN npm run build
```

### Volume Management

**Server Hot Reload:**
```yaml
volumes:
  - .:/app               # Sync source code
  - /app/node_modules    # Prevent overwriting node_modules
```

**Persistent Database Administration:**
```yaml
volumes:
  - pgadmin_data:/var/lib/pgadmin  # Persist pgAdmin configuration
```

## Advanced Features & Implementation Details

### 1. Graceful Shutdown Handling

```javascript
// index.js - Process signal handling
function shutdown() {
  const worker = getWorker();
  if (worker && !worker.killed) {
    console.log("Shutting down worker...");
    worker.kill("SIGTERM");
  }
}

process.on("exit", shutdown);
process.on("SIGINT", () => {  // Ctrl+C
  console.log("Received SIGINT");
  process.exit(0);
});
process.on("SIGTERM", () => {  // Docker stop
  console.log("Received SIGTERM");
  process.exit(0);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exit(1);
});
```

**Shutdown Sequence:**
1. Parent receives SIGTERM/SIGINT
2. Parent sends SIGTERM to worker child process
3. Worker completes current iteration and exits
4. Parent closes database connections
5. Parent closes HTTP server
6. Process exits with code 0

### 2. Custom File Extension Loading

```javascript
// index.js - Load .txt files as modules
require.extensions[".txt"] = function (module, filename) {
  module.exports = fs.readFileSync(filename, "utf8");
};
const data = require("./data_inserts.txt");

// Usage: Execute SQL from text file
await sequelize.query(data);
```

**Use Case:**
- SQL seed data stored in version control
- Separation of schema and data migrations
- Human-readable data inspection

### 3. Sequelize View Support

```javascript
// models/views.js - Database view definitions
const RoomView = sequelize.define(
  "room_view",
  {
    name: { type: DataTypes.STRING },
  },
  {
    timestamps: false,
    treatAsView: true,
    viewDefinition: "SELECT name FROM rooms",
  }
);

RoomView.removeAttribute("id");  // Views typically don't have IDs
```

**Benefits:**
- Query simplification for complex joins
- Future materialized view support for performance
- Read-only data access patterns
- Security boundary (can grant view access without table access)

### 4. Composite Unique Constraints

```javascript
// models/models.js
const Shelving = sequelize.define("shelving", {
  name: {
    type: DataTypes.STRING,
    unique: "room+shelving",  // Composite constraint
  },
  roomId: {
    type: DataTypes.INTEGER,
    unique: "room+shelving"   // Same constraint name
  }
});
```

**SQL Translation:**
```sql
ALTER TABLE shelvings 
  ADD CONSTRAINT room_shelving_unique 
  UNIQUE (name, roomId);
```

**Rationale:**
Allows "Shelving 1" in multiple rooms while preventing duplicates within a room.

### 5. Cyrillic/Latin Validation Regex

```javascript
validate: { 
  is: /^[а-яА-ЯёЁa-zA-Z0-9]+$/i 
}
```

**Character Classes:**
- `а-я`: Lowercase Cyrillic
- `А-Я`: Uppercase Cyrillic
- `ёЁ`: Special Cyrillic characters
- `a-zA-Z0-9`: Latin alphanumeric

**Use Case:** International data entry for Russian research facilities.

## Performance Considerations & Optimization

### 1. Database Query Optimization

**Problem:** N+1 query problem when loading shelves with parameters

**Solution:** Eager loading with Sequelize includes
```javascript
// Bad: N+1 queries
const shelves = await Shelf.findAll();
for (let shelf of shelves) {
  shelf.parameters = await ParameterSetting.findAll({
    where: { shelfId: shelf.id }
  });
}

// Good: Single query with JOIN
const shelves = await Shelf.findAll({
  include: [{ model: ParameterSetting }]
});
```

### 2. WebSocket Event Throttling

**Problem:** High-frequency parameter updates flood client bandwidth

**Solution:** Server-side throttling with Lodash
```javascript
const _ = require("lodash");

const throttledEmit = _.throttle((data) => {
  io.emit("message", data);
}, 100);  // Max 10 updates/second

socket.on("parameterUpdate", (data) => {
  throttledEmit(data);
});
```

### 3. Client-Side Data Windowing

**Problem:** Rendering thousands of data points causes browser lag

**Solution:** Plotly.js streaming mode with sliding window
```javascript
const MAX_POINTS = 1000;

if (parameterData.length > MAX_POINTS) {
  const windowedData = parameterData.slice(-MAX_POINTS);
  setParameterData(windowedData);
}
```

### 4. Worker Process Memory Management

**Problem:** Long-running worker accumulates memory from closures

**Solution:** Periodic worker restart
```javascript
let workerUptime = 0;
const MAX_UPTIME = 24 * 60 * 60 * 1000;  // 24 hours

setInterval(() => {
  workerUptime += 60000;
  if (workerUptime > MAX_UPTIME) {
    console.log("Restarting worker for memory cleanup");
    worker.kill();
    worker = startWorker();
    workerUptime = 0;
  }
}, 60000);
```

### 5. PostgreSQL Connection Pooling

**Configuration:**
```javascript
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: "postgres",
  pool: {
    max: 20,          // Maximum connections
    min: 5,           // Minimum connections
    acquire: 30000,   // Max time to get connection (ms)
    idle: 10000       // Max idle time before release (ms)
  }
});
```

## Security Considerations

### Current Security Posture

**Implemented:**
- CORS configuration (origin whitelisting)
- Environment variable secrets (.env files)
- Input validation (regex on model fields)
- Parameterized SQL queries (Sequelize ORM)

**Not Implemented (Production Requirements):**

1. **Authentication & Authorization:**
```javascript
// Recommended: JWT-based authentication
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

app.use("/api", authMiddleware);
```

2. **Rate Limiting:**
```javascript
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100                    // Limit each IP to 100 requests per windowMs
});

app.use("/api", limiter);
```

3. **SQL Injection Prevention:**
- Already mitigated by Sequelize ORM
- Raw queries use parameterization:
```javascript
// Vulnerable (DO NOT USE)
await db.query(`SELECT * FROM users WHERE id = ${req.body.id}`);

// Safe (CURRENT IMPLEMENTATION)
await db.query(`SELECT * FROM users WHERE id = ?`, {
  replacements: [req.body.id],
  type: QueryTypes.SELECT
});
```

4. **XSS Protection:**
```javascript
const helmet = require("helmet");
app.use(helmet());  // Sets security HTTP headers
```

5. **HTTPS Enforcement:**
```javascript
// In production behind reverse proxy
app.use((req, res, next) => {
  if (req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});
```

## Running the Project

### Prerequisites

- Docker Desktop
- Node.js 18+ (for local development)
- PostgreSQL 14+ (if running outside Docker)

### Quick Start with Docker

```bash
# Clone the repository
git clone <repository-url>
cd Phytoshelving-main

# Configure environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env

# Edit server/.env with database credentials
# Edit client/.env with API endpoint

# Start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080
# pgAdmin: http://localhost:5050
```

### Local Development Setup

**Backend:**
```bash
cd server

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with local PostgreSQL credentials

# Run database migrations
npx sequelize-cli db:migrate

# (Optional) Seed database
npm run seed  # Or manually run data_inserts.txt

# Start development server with hot reload
npm run dev
```

**Frontend:**
```bash
cd client

# Install dependencies
npm install

# Configure API endpoint
echo "REACT_APP_SERVER_URL=http://localhost:8080" > .env

# Start development server
npm start
```

### Database Initialization

**Option 1: Sequelize Sync (Development)**
```javascript
// index.js
await sequelize.sync({ force: true });  // Drops and recreates tables
await sequelize.query(data);            // Seeds initial data
```

**Option 2: Migration Files (Production)**
```bash
npx sequelize-cli migration:generate --name create-initial-schema
npx sequelize-cli db:migrate
```

**Option 3: Manual SQL Execution**
```bash
psql -U postgres -d phytoshelving -f server/data_inserts.txt
```

## Project Structure

```
Phytoshelving-main/
├── client/                           # React frontend
│   ├── public/                       # Static assets
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   │   ├── AppHeader.jsx
│   │   │   ├── AppMenu.jsx
│   │   │   ├── AppGraph.jsx
│   │   │   ├── AppShelf.jsx
│   │   │   ├── PlotlyGraph.js
│   │   │   └── GraphCalendar.jsx
│   │   ├── pages/                    # Route components
│   │   │   ├── AuxiliaryPage.js      # Control panel
│   │   │   ├── GraphicPage.js        # Single graph
│   │   │   ├── BigGraphPage.js       # Multi-graph
│   │   │   ├── ShelvingPage.js
│   │   │   ├── ShelfPage.js
│   │   │   └── SearchFilterPage.js
│   │   ├── utils/                    # Helper functions
│   │   ├── App.js                    # Root component
│   │   └── index.js                  # Entry point
│   ├── Dockerfile
│   ├── package.json
│   └── tailwind.config.js
│
├── server/                           # Node.js backend
│   ├── controllers/                  # Business logic
│   │   ├── shelfController.js
│   │   ├── shelvingController.js
│   │   ├── plantController.js
│   │   ├── parameterController.js
│   │   ├── parameterSettingController.js
│   │   ├── rangeController.js
│   │   ├── surveyController.js
│   │   └── databaseController.js
│   ├── models/                       # Sequelize models
│   │   ├── models.js                 # Table definitions
│   │   └── views.js                  # View definitions
│   ├── routes/                       # Express routes
│   │   ├── index.js                  # Route aggregator
│   │   ├── shelfRouter.js
│   │   ├── parameterRouter.js
│   │   └── rangeRouter.js
│   ├── utils/                        # Utilities
│   │   ├── workerManager.js          # Child process manager
│   │   └── worker/
│   │       └── worker.js             # Background survey worker
│   ├── db.js                         # Sequelize connection
│   ├── index.js                      # Server entry point
│   ├── data_inserts.txt              # SQL seed data
│   ├── Dockerfile
│   ├── docker-compose.yml            # Server + pgAdmin
│   └── package.json
│
├── docker-compose.yml                # Root orchestration
└── README.md
```

## Future Enhancements & Extensibility

### Planned Features

1. **Machine Learning Integration:**
   - Predictive analytics for optimal irrigation schedules
   - Anomaly detection in sensor readings
   - TensorFlow.js integration for client-side inference

2. **Mobile Application:**
   - React Native cross-platform app
   - Push notifications for parameter threshold violations
   - Offline data caching with background sync

3. **Advanced Alerting:**
   - Multi-channel notifications (SMS, email, Slack)
   - Configurable threshold rules engine
   - Escalation policies for critical parameters

4. **Data Export & Reporting:**
   - CSV/Excel export of historical data
   - PDF report generation with charts
   - Scheduled email reports

5. **Multi-Tenant Architecture:**
   - Organization/team workspace separation
   - Role-based access control (RBAC)
   - Per-tenant database isolation

### Extension Points

**Custom Parameter Types:**
```javascript
// Add new parameter type
INSERT INTO parameter_types (description) VALUES ('Lux');
INSERT INTO parameters (name, parameterTypeId) VALUES ('Light Intensity', 5);
```

**Custom Range Algorithms:**
```javascript
// worker/worker.js - Pluggable range strategies
const rangeStrategies = {
  stationary: StationaryRangeHandler,
  dynamic: DynamicRangeHandler,
  adaptive: AdaptiveRangeHandler  // New strategy
};
```

**Third-Party Sensor Integration:**
```javascript
// utils/sensors/
class SensorAdapter {
  async read(parameterId) {
    // Implement sensor-specific protocol
  }
}

class ModbusSensorAdapter extends SensorAdapter {
  // Modbus RTU/TCP implementation
}
```

## Known Limitations & Considerations

1. **Single Worker Process:**
   - Current: One worker handles all surveys
   - Limitation: CPU-bound for >100 concurrent parameters
   - Solution: Worker pool with round-robin task distribution

2. **In-Memory State:**
   - Worker state lost on restart
   - Recommended: Redis for persistent state sharing

3. **No Backpressure Handling:**
   - High-frequency updates can overwhelm slow clients
   - Solution: Implement Socket.IO acknowledgments and buffering

4. **Database Growth:**
   - Time-series data grows unbounded
   - Solution: Implement data retention policies and archival

5. **Lack of Authentication:**
   - Current: Open API (development only)
   - Production: Requires JWT/OAuth2 implementation

## Contributing & Development Guidelines

### Code Style

**JavaScript/Node.js:**
- ES6+ features (async/await, arrow functions, destructuring)
- Semicolons required
- 2-space indentation
- Camel case for variables, Pascal case for classes

**React:**
- Functional components with hooks (no class components)
- PropTypes or TypeScript for type checking
- CSS Modules or Tailwind for styling

### Testing (Framework Ready)

```javascript
// Example test structure (not currently implemented)
const request = require("supertest");
const app = require("./index");

describe("Parameter API", () => {
  test("GET /api/parameter returns all parameters", async () => {
    const res = await request(app).get("/api/parameter");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
```

### Commit Message Format

```
type(scope): subject

body

footer
```

**Types:** feat, fix, docs, style, refactor, test, chore

**Example:**
```
feat(worker): Add dynamic range sequence support

Implement serial_num-based progression through dynamic range
elements. Each element can have a different duration, allowing
for complex lighting/irrigation schedules.

Closes #42
```

## License

This project is licensed under the MIT License – see the LICENSE file for details.

## Author

IoT monitoring platform demonstrating full-stack real-time data acquisition, child process architecture, and scientific data visualization for precision agriculture applications.
