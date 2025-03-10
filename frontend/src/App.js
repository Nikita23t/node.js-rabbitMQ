import React, { useState, useEffect } from 'react';
import axios from 'axios';

// когда-нибудь я раскидаю это все по модулям и бужет красиво

function App() {
  const [inputText, setInputText] = useState('');
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [sentTasks, setSentTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('form');
  const [searchId, setSearchId] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const [server1Logs, server2Logs] = await Promise.all([
          axios.get('http://localhost:3001/logs'),
          axios.get('http://localhost:3002/logs')
        ]);

        const mergedLogs = [...server1Logs.data, ...server2Logs.data]
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        setLogs(mergedLogs);
      } catch (error) {
        console.error('Ошибка при загрузке логов:', error);
      }
    };

    const interval = setInterval(fetchLogs, 500);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('http://localhost:3001/task', { text: inputText })
      .then((response) => {
        setSentTasks(prev => [...prev, response.data]);
        setInputText('');
      })
      .catch(console.error);
  };

  const handleSearch = (e) => {
    const value = e.target.value.trim();
    setSearchId(value);
  
    if (value) {
      const exactMatch = logs.filter(log => String(log.taskId) === value);
      setFilteredLogs(exactMatch);
    } else {
      setFilteredLogs([]);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('form')}>
          Новая задача ({sentTasks.length})
        </button>
        <button onClick={() => setActiveTab('logs')} style={{ marginLeft: 10 }}>
          Логи (всего: {logs.length})
        </button>
      </div>

      {activeTab === 'form' ? (
        <div>
          <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Введите задачу"
              style={{ width: '300px', marginRight: '10px' }}
            />
            <button type="submit">Отправить</button>
          </form>

          <h3>Отправленные задачи:</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Время создания</th>
                  <th style={tableHeaderStyle}>ID задачи</th>
                  <th style={tableHeaderStyle}>Текст задачи</th>
                </tr>
              </thead>
              <tbody>
                {sentTasks.map((task, index) => (
                  <tr key={index} style={index % 2 === 0 ? evenRowStyle : oddRowStyle}>
                    <td style={tableCellStyle}>
                      {new Date(task.id).toLocaleString()}
                    </td>
                    <td style={tableCellStyle}>{task.id}</td>
                    <td style={tableCellStyle}>{task.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <h2>Системные логи</h2>
          <input
            type="text"
            value={searchId}
            onChange={handleSearch}
            placeholder="Поиск по ID задачи"
            style={{ width: '300px', marginBottom: '10px' }}
          />

          {/* Результаты поиска */}
          {filteredLogs.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3>Результаты поиска:</h3>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={tableHeaderStyle}>Время</th>
                      <th style={tableHeaderStyle}>Событие</th>
                      <th style={tableHeaderStyle}>Откуда</th>
                      <th style={tableHeaderStyle}>Куда</th>
                      <th style={tableHeaderStyle}>ID задачи</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log, index) => (
                      <tr key={index} style={index % 2 === 0 ? evenRowStyle : oddRowStyle}>
                        <td style={tableCellStyle}>
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td style={tableCellStyle}>{log.event}</td>
                        <td style={tableCellStyle}>{log.source}</td>
                        <td style={tableCellStyle}>{log.destination}</td>
                        <td style={tableCellStyle}>{log.taskId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Все логи */}
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Время</th>
                  <th style={tableHeaderStyle}>Событие</th>
                  <th style={tableHeaderStyle}>Откуда</th>
                  <th style={tableHeaderStyle}>Куда</th>
                  <th style={tableHeaderStyle}>ID задачи</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr key={index} style={index % 2 === 0 ? evenRowStyle : oddRowStyle}>
                    <td style={tableCellStyle}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={tableCellStyle}>{log.event}</td>
                    <td style={tableCellStyle}>{log.source}</td>
                    <td style={tableCellStyle}>{log.destination}</td>
                    <td style={tableCellStyle}>{log.taskId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const tableHeaderStyle = {
  padding: '10px',
  backgroundColor: '#f0f0f0',
  borderBottom: '1px solid #ddd',
  textAlign: 'left'
};

const tableCellStyle = {
  padding: '10px',
  borderBottom: '1px solid #ddd',
  textAlign: 'left'
};

const evenRowStyle = {
  backgroundColor: '#f9f9f9'
};

const oddRowStyle = {
  backgroundColor: '#ffffff'
};

export default App;