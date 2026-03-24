import { useEffect, useState } from 'react';
import { checkHealth } from '../services/api';
import { Activity, ShieldCheck, Users, Calendar, CreditCard, Bell, Video, Cpu } from 'lucide-react';

const services = [
    { id: 'auth', name: 'Auth Service', icon: ShieldCheck },
    { id: 'patients', name: 'Patient Service', icon: Users },
    { id: 'doctors', name: 'Doctor Service', icon: Activity },
    { id: 'appointments', name: 'Appointment Service', icon: Calendar },
    { id: 'payments', name: 'Payment Service', icon: CreditCard },
    { id: 'notifications', name: 'Notification Service', icon: Bell },
    { id: 'telemedicine', name: 'Telemedicine Service', icon: Video },
    { id: 'ai', name: 'AI Service', icon: Cpu },
];

export default function Home() {
    const [status, setStatus] = useState({});

    useEffect(() => {
        const fetchStatus = async () => {
            const results = await Promise.all(services.map(s => checkHealth(s.id)));
            const statusMap = {};
            results.forEach(res => {
                statusMap[res.service] = res;
            });
            setStatus(statusMap);
        };
        fetchStatus();
    }, []);

    return (
        <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
            <h1 style={{ color: '#2c3e50', marginBottom: '10px' }}>Healthcare Microservices Dashboard</h1>
            <p style={{ color: '#7f8c8d', marginBottom: '40px' }}>Real-time status of the integrated medical platform services.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {services.map(service => {
                    const info = status[service.id] || { status: 'LOADING' };
                    const Icon = service.icon;
                    return (
                        <div key={service.id} style={{ 
                            backgroundColor: 'white', 
                            padding: '24px', 
                            borderRadius: '12px', 
                            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                            borderLeft: `6px solid ${info.status === 'UP' ? '#2ecc71' : info.status === 'DOWN' ? '#e74c3c' : '#bdc3c7'}`
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                                <div style={{ backgroundColor: '#f0f2f5', padding: '10px', borderRadius: '8px', marginRight: '15px' }}>
                                    <Icon size={24} color="#3498db" />
                                </div>
                                <h2 style={{ fontSize: '18px', margin: 0, color: '#34495e' }}>{service.name}</h2>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ 
                                    padding: '4px 12px', 
                                    borderRadius: '20px', 
                                    fontSize: '12px', 
                                    fontWeight: 'bold',
                                    backgroundColor: info.status === 'UP' ? '#eafaf1' : info.status === 'DOWN' ? '#fdedec' : '#f4f6f7',
                                    color: info.status === 'UP' ? '#2ecc71' : info.status === 'DOWN' ? '#e74c3c' : '#7f8c8d'
                                }}>
                                    {info.status}
                                </span>
                                <span style={{ fontSize: '13px', color: '#95a5a6' }}>{info.message || 'Connecting...'}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
