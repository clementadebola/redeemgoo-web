'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation'; // ✅ Added router hook
import { 
  getAuth, signInWithEmailAndPassword, signOut, updatePassword, onAuthStateChanged, Auth 
} from 'firebase/auth';
import { 
  getFirestore, collection, onSnapshot, doc, getDoc, Firestore 
} from 'firebase/firestore';
import app from '../lib/firebase'; 
import { 
  Shield, Users, Network, Compass, KeyRound, 
  LogOut, Activity, Lock, Mail, RefreshCw, BarChart3, Menu, X, ArrowLeft 
} from 'lucide-react';

const getAdminAuth = (): Auth => {
  if (!app) throw new Error("Firebase Auth invoked on server prematurely.");
  return getAuth(app);
};

const getAdminDb = (): Firestore => {
  if (!app) throw new Error("Firebase Firestore invoked on server prematurely.");
  return getFirestore(app);
};

const Colors = {
  adminBg: '#11221C',     
  adminCard: '#1e293b',   
  primary: '#10b981',     
  primaryLight: 'rgba(16, 185, 129, 0.1)',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  border: '#334155',
  error: '#ef4444',
  success: '#22c55e'
};

type AdminTab = 'metrics' | 'users' | 'groups' | 'security';

interface LiveUser {
  id: string;
  displayName?: string;
  username?: string;
  email?: string;
}

interface LiveGroup {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
}

export default function AdminDashboardPortal() {
  const router = useRouter(); // ✅ Initialized router instance
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [activeTab, setActiveTab] = useState<AdminTab>('metrics');
  const [users, setUsers] = useState<LiveUser[]>([]);
  const [groups, setGroups] = useState<LiveGroup[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalGroups: 0, onlineTracking: 0 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const authInstance = getAdminAuth();
    const dbInstance = getAdminDb();

    const checkAdminAccess = onAuthStateChanged(authInstance, async (userInstance) => {
      if (userInstance) {
        try {
          const adminDocRef = doc(dbInstance, 'admins', userInstance.uid);
          const adminSnap = await getDoc(adminDocRef);
          
          if (adminSnap.exists() && adminSnap.data().role === 'superadmin') {
            setIsAdmin(true);
          } else {
            setLoginError('Access denied: Unauthorized identity.');
            await signOut(authInstance);
            setIsAdmin(false);
          }
        } catch (err: any) {
          setLoginError('Security handshake timed out.');
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });

    return () => checkAdminAccess();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const dbInstance = getAdminDb();

    const unsubUsers = onSnapshot(collection(dbInstance, 'users'), (snapshot) => {
      const usersList: LiveUser[] = [];
      snapshot.forEach((docSnap) => {
        usersList.push({ id: docSnap.id, ...docSnap.data() } as LiveUser);
      });
      setUsers(usersList);
      setStats(prev => ({ ...prev, totalUsers: usersList.length }));
    });

    const unsubGroups = onSnapshot(collection(dbInstance, 'groups'), (snapshot) => {
      const groupsList: LiveGroup[] = [];
      snapshot.forEach((docSnap) => {
        groupsList.push({ id: docSnap.id, ...docSnap.data() } as LiveGroup);
      });
      setGroups(groupsList);
      setStats(prev => ({ ...prev, totalGroups: groupsList.length }));
    });

    const unsubTracking = onSnapshot(collection(dbInstance, 'locations'), (snapshot) => {
      let activeTrackingNodes = 0;
      snapshot.forEach((docSnap) => {
        if (docSnap.data().activeDestination) activeTrackingNodes++;
      });
      setStats(prev => ({ ...prev, onlineTracking: activeTrackingNodes }));
    });

    return () => {
      unsubUsers();
      unsubGroups();
      unsubTracking();
    };
  }, [isAdmin]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(getAdminAuth(), email, password);
    } catch (err: any) {
      setLoginError('Invalid credentials supplied.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    const authInstance = getAdminAuth();
    const currentAdmin = authInstance.currentUser;
    if (!currentAdmin) return;

    try {
      await updatePassword(currentAdmin, newPassword);
      setPasswordSuccess('Master security password keys updated successfully.');
      setNewPassword('');
    } catch (err: any) {
      setPasswordError(err.message);
    }
  };

  if (authLoading) {
    return (
      <LoadingFallbackWrapper>
        <RefreshCw className="animate-spin" size={32} color={Colors.primary} />
        <span>Syncing Gateway Systems...</span>
      </LoadingFallbackWrapper>
    );
  }

  // ─── LOGIN GUARD VIEWPORT FRAME ───────────────────────────────────────────
  if (!isAdmin) {
    return (
      <LoginViewportContainer>
        <LoginFormBox onSubmit={handleAdminLogin}>
          {/* ✅ RETURN BUTTON FOR LOGGED-OUT USERS */}
          <ExitToWebsiteLink type="button" onClick={() => router.push('/')}>
            <ArrowLeft size={14} />
            <span>Return to Site</span>
          </ExitToWebsiteLink>

          <LogoHeaderCluster>
            <Shield size={36} color={Colors.primary} />
            <h2>RedeemGo Master Admin</h2>
            <p>Access restricted to core infrastructure operations nodes only.</p>
          </LogoHeaderCluster>

          {loginError && <ErrorMessageCard>{loginError}</ErrorMessageCard>}

          <InputWrapperField>
            <label>ADMIN EMAIL</label>
            <div className="input-row">
              <Mail size={16} />
              <input 
                type="email" 
                placeholder="root@redeemgo.com" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required 
              />
            </div>
          </InputWrapperField>

          <InputWrapperField>
            <label>ACCESS CLEARANCE KEY</label>
            <div className="input-row">
              <Lock size={16} />
              <input 
                type="password" 
                placeholder="••••••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
              />
            </div>
          </InputWrapperField>

          <LoginButtonAction type="submit">Authenticate Session</LoginButtonAction>
        </LoginFormBox>
      </LoginViewportContainer>
    );
  }

  // ─── MASTER DASHBOARD WORKSPACE ───────────────────────────────────────────
  return (
    <MasterAdminWorkspace>
      {/* Mobile Top Header Bar */}
      <MobileTopHeaderBar>
        <div className="brand">
          <Compass size={20} color={Colors.primary} />
          <span>RedeemGo Admin</span>
        </div>
        <MenuToggleButton onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </MenuToggleButton>
      </MobileTopHeaderBar>

      {/* Sidebar Navigation */}
      <AdminNavigationSidebar $isOpen={isMobileMenuOpen}>
        <BrandBadgeRow>
          <Compass size={22} color={Colors.primary} />
          <span>RedeemGo Core</span>
        </BrandBadgeRow>

        <NavigationLinksStack>
          <NavTabButton $active={activeTab === 'metrics'} onClick={() => { setActiveTab('metrics'); setIsMobileMenuOpen(false); }}>
            <BarChart3 size={16} /> <span>System Overview</span>
          </NavTabButton>
          <NavTabButton $active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }}>
            <Users size={16} /> <span>User Registries ({users.length})</span>
          </NavTabButton>
          <NavTabButton $active={activeTab === 'groups'} onClick={() => { setActiveTab('groups'); setIsMobileMenuOpen(false); }}>
            <Network size={16} /> <span>Circle Pipelines ({groups.length})</span>
          </NavTabButton>
          <NavTabButton $active={activeTab === 'security'} onClick={() => { setActiveTab('security'); setIsMobileMenuOpen(false); }}>
            <KeyRound size={16} /> <span>Access & Safety</span>
          </NavTabButton>
          
          <DividerLine />

          {/* ✅ RETURN BUTTON FOR LOGGED-IN ADMINE ON SIDEBAR */}
          <NavTabButton $active={false} onClick={() => router.push('/')} style={{ color: '#38bdf8' }}>
            <ArrowLeft size={16} /> <span>Exit to Live Site</span>
          </NavTabButton>
        </NavigationLinksStack>

        <DisconnectSessionButton onClick={() => signOut(getAdminAuth())}>
          <LogOut size={16} />
          <span>Terminate Session</span>
        </DisconnectSessionButton>
      </AdminNavigationSidebar>

      <MainWorkspaceBodyContent>
        {activeTab === 'metrics' && (
          <TabGridContainer>
            <HeadingClusterRow>
              <h2>System Infrastructures Overview</h2>
              <p>Real-time data feeds processed directly via global Firestore cluster triggers.</p>
            </HeadingClusterRow>

            <TelemetryTelemetryMetricsGrid>
              <TelemetryCard>
                <div className="card-top">
                  <Users size={24} color={Colors.primary} />
                  <span className="card-title">TOTAL REGISTERED USER BASE</span>
                </div>
                <h3>{stats.totalUsers}</h3>
                <p className="sub-meta">Live profile account entries</p>
              </TelemetryCard>

              <TelemetryCard>
                <div className="card-top">
                  <Network size={24} color="#3b82f6" />
                  <span className="card-title">ACTIVE INTERACTIVE CIRCLES</span>
                </div>
                <h3>{stats.totalGroups}</h3>
                <p className="sub-meta">Active multi-user tracking pipelines</p>
              </TelemetryCard>

              <TelemetryCard>
                <div className="card-top">
                  <Activity size={24} color="#eab308" />
                  <span className="card-title">LIVE GPS NAVIGATION TRACKS</span>
                </div>
                <h3>{stats.onlineTracking}</h3>
                <p className="sub-meta">Active navigation routes currently streaming</p>
              </TelemetryCard>
            </TelemetryTelemetryMetricsGrid>
          </TabGridContainer>
        )}

        {activeTab === 'users' && (
          <TabGridContainer>
            <HeadingClusterRow>
              <h2>User Accounts Registry</h2>
              <p>Comprehensive live database listing of users currently mapped to the ecosystem profile loops.</p>
            </HeadingClusterRow>

            <AdaptiveListContainer>
              <DesktopTableWrapper>
                <thead>
                  <tr>
                    <th>FIRESTORE IDENTIFIER UID</th>
                    <th>ACCOUNT DISPLAY NAME</th>
                    <th>SYSTEM USERNAME</th>
                    <th>EMAIL HANDLES</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className="monospace">{u.id}</td>
                      <td className="bold">{u.displayName || 'Unnamed Traveler'}</td>
                      <td>@{u.username || 'unknown'}</td>
                      <td className="email-row">{u.email || 'No email synced'}</td>
                    </tr>
                  ))}
                </tbody>
              </DesktopTableWrapper>

              <MobileCardsStack>
                {users.map(u => (
                  <DataMobileCard key={u.id}>
                    <div className="card-row"><strong>Name:</strong> {u.displayName || 'Unnamed Traveler'}</div>
                    <div className="card-row"><strong>Username:</strong> @{u.username || 'unknown'}</div>
                    <div className="card-row"><strong>Email:</strong> {u.email || 'No email synced'}</div>
                    <div className="card-row monospace-id"><strong>UID:</strong> {u.id}</div>
                  </DataMobileCard>
                ))}
              </MobileCardsStack>
            </AdaptiveListContainer>
          </TabGridContainer>
        )}

        {activeTab === 'groups' && (
          <TabGridContainer>
            <HeadingClusterRow>
              <h2>Circle Pipelines Directory</h2>
              <p>Active multi-peer alignment network directories mapping family monitoring parameters.</p>
            </HeadingClusterRow>

            <AdaptiveListContainer>
              <DesktopTableWrapper>
                <thead>
                  <tr>
                    <th>GROUP CORE ID</th>
                    <th>CIRCLE ACCESS NAME</th>
                    <th>CREATOR ADMIN ID</th>
                    <th>LINKED MEMBERS BOUND</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map(g => (
                    <tr key={g.id}>
                      <td className="monospace">{g.id}</td>
                      <td className="bold">{g.name}</td>
                      <td className="monospace text-secondary">{g.ownerId}</td>
                      <td>
                        <MembersBadgeCounter>{g.members?.length || 0} Peers</MembersBadgeCounter>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DesktopTableWrapper>

              <MobileCardsStack>
                {groups.map(g => (
                  <DataMobileCard key={g.id}>
                    <div className="card-row"><strong>Circle Name:</strong> {g.name}</div>
                    <div className="card-row"><strong>Members:</strong> <MembersBadgeCounter style={{marginTop: '2px'}}>{g.members?.length || 0} Connected</MembersBadgeCounter></div>
                    <div className="card-row monospace-id"><strong>Owner ID:</strong> {g.ownerId}</div>
                    <div className="card-row monospace-id"><strong>Group ID:</strong> {g.id}</div>
                  </DataMobileCard>
                ))}
              </MobileCardsStack>
            </AdaptiveListContainer>
          </TabGridContainer>
        )}

        {activeTab === 'security' && (
          <TabGridContainer style={{ maxWidth: '560px' }}>
            <HeadingClusterRow>
              <h2>Administrative Access Overrides</h2>
              <p>Modify the primary master encryption security password keys assigned to this infrastructure workspace access path.</p>
            </HeadingClusterRow>

            <InteractiveFormCard style={{ background: Colors.adminCard, border: `1px solid ${Colors.border}` }} onSubmit={handlePasswordChange}>
              {passwordError && <ErrorMessageCard>{passwordError}</ErrorMessageCard>}
              {passwordSuccess && <SuccessMessageCard>{passwordSuccess}</SuccessMessageCard>}

              <InputWrapperField>
                <label>NEW SECURITY RE-AUTHENTICATION PHRASE</label>
                <div className="input-row">
                  <Lock size={16} />
                  <input 
                    type="password" 
                    placeholder="Minimum 6 secure alphanumeric bytes" 
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </InputWrapperField>

              <SubmitButton style={{ height: '44px' }} type="submit">Commit Security Credentials</SubmitButton>
            </InteractiveFormCard>
          </TabGridContainer>
        )}
      </MainWorkspaceBodyContent>
    </MasterAdminWorkspace>
  );
}

// ─── STYLED DESIGN PANELS INFRASTRUCTURES ───────────────────────────────────
const LoadingFallbackWrapper = styled.div`
  width: 100vw;
  height: 100vh;
  background-color: ${Colors.adminBg};
  color: ${Colors.textPrimary};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  font-family: monospace;
  .animate-spin { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const LoginViewportContainer = styled.div`
  width: 100vw;
  height: 100vh;
  background-color: ${Colors.adminBg};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
`;

const LoginFormBox = styled.form`
  background-color: ${Colors.adminCard};
  border: 1px solid ${Colors.border};
  width: 100%;
  max-width: 420px;
  border-radius: 24px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  @media(min-width: 480px) { padding: 32px; }
`;

const ExitToWebsiteLink = styled.button`
  background: none;
  border: none;
  color: ${Colors.textSecondary};
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  align-self: flex-start;
  padding: 0;
  transition: color 0.2s;
  &:hover { color: ${Colors.primary}; }
`;

const LogoHeaderCluster = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
  margin-top: 8px;
  h2 { font-size: 20px; font-weight: 800; color: ${Colors.textPrimary}; margin: 6px 0 0 0; }
  p { font-size: 12px; color: ${Colors.textSecondary}; margin: 0; line-height: 1.4; }
`;

const InputWrapperField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  label { font-size: 10px; font-weight: 800; color: ${Colors.textSecondary}; letter-spacing: 0.5px; }
  
  .input-row {
    background-color: ${Colors.adminBg};
    border: 1px solid ${Colors.border};
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    padding: 0 14px;
    gap: 10px;
    color: ${Colors.textSecondary};
    &:focus-within { border-color: ${Colors.primary}; color: ${Colors.primary}; }
  }

  input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: ${Colors.textPrimary};
    font-size: 14px;
  }
`;

const LoginButtonAction = styled.button`
  background-color: ${Colors.primary};
  color: white;
  border: none;
  border-radius: 12px;
  height: 48px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
  &:hover { opacity: 0.9; }
`;

const ErrorMessageCard = styled.div`
  background-color: rgba(239, 68, 68, 0.15);
  color: ${Colors.error};
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 12px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
`;

const SuccessMessageCard = styled(ErrorMessageCard)`
  background-color: rgba(34, 197, 94, 0.15);
  color: ${Colors.success};
  border: 1px solid rgba(34, 197, 94, 0.2);
`;

const MasterAdminWorkspace = styled.div`
  width: 100vw;
  height: 100vh;
  background-color: ${Colors.adminBg};
  display: flex;
  flex-direction: column;
  color: ${Colors.textPrimary};
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  overflow: hidden;

  @media(min-width: 1024px) {
    display: grid;
    grid-template-columns: 260px 1fr;
  }
`;

const MobileTopHeaderBar = styled.div`
  background-color: ${Colors.adminCard};
  border-bottom: 1px solid ${Colors.border};
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 110;
  
  .brand { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 15px; }
  @media(min-width: 1024px) { display: none; }
`;

const MenuToggleButton = styled.button`
  background: none;
  border: none;
  color: ${Colors.textPrimary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AdminNavigationSidebar = styled.aside<{ $isOpen: boolean }>`
  background-color: ${Colors.adminCard};
  border-right: 1px solid ${Colors.border};
  padding: 24px;
  
  /* ✅ FIXED: Aggressive bottom padding to clear iPhone notches & browser bars */
  padding-bottom: max(48px, env(safe-area-inset-bottom)); 
  
  display: flex;
  flex-direction: column;
  gap: 32px;
  position: absolute;
  top: 64px;
  left: 0;
  width: 100%;
  
  /* ✅ FIXED: Use Dynamic Viewport Height (dvh) so it doesn't hide behind mobile toolbars */
  height: calc(100vh - 64px); /* Fallback for older browsers */
  height: calc(100dvh - 64px); 
  
  z-index: 100;
  transform: translateX(${({ $isOpen }) => ($isOpen ? '0' : '-100%')});
  transition: transform 0.2s ease-in-out;

  @media(min-width: 1024px) {
    position: static;
    transform: none;
    height: 100vh;
    padding-bottom: 24px; /* Reset padding for desktop */
  }
`;

const BrandBadgeRow = styled.div`
  display: none;
  @media(min-width: 1024px) {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 800;
    font-size: 16px;
    letter-spacing: -0.5px;
  }
`;

const NavigationLinksStack = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`;

const DividerLine = styled.div`
  height: 1px;
  background-color: ${Colors.border};
  margin: 12px 4px;
  width: 100%;
`;

const NavTabButton = styled.button<{ $active: boolean }>`
  background-color: ${({ $active }) => ($active ? Colors.primary : 'transparent')};
  color: ${({ $active }) => ($active ? '#ffffff' : Colors.textSecondary)};
  border: none;
  padding: 12px 14px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background-color: ${({ $active }) => ($active ? Colors.primary : Colors.primaryLight)}; color: ${({ $active }) => ($active ? '#ffffff' : Colors.primary)}; }
`;

const DisconnectSessionButton = styled.button`
  background: none;
  border: 1px solid ${Colors.border};
  color: ${Colors.textSecondary};
  padding: 12px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  
  /* ✅ FIXED: Added a little extra margin to push it up visually */
  margin-bottom: 40px; 
  
  &:hover { 
    border-color: ${Colors.error}; 
    color: ${Colors.error}; 
    background: rgba(239, 68, 68, 0.05); 
  }
`;

const MainWorkspaceBodyContent = styled.main`
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  @media(min-width: 768px) { padding: 40px; }
`;

const TabGridContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  animation: fadeIn 0.3s ease-out;
  @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } }
  @media(min-width: 768px) { gap: 32px; }
`;

const HeadingClusterRow = styled.div`
  h2 { font-size: 20px; font-weight: 800; margin: 0; letter-spacing: -0.5px; }
  p { font-size: 13px; color: ${Colors.textSecondary}; margin: 4px 0 0 0; font-weight: 500; }
  @media(min-width: 768px) {
    h2 { font-size: 24px; }
    p { font-size: 14px; }
  }
`;

const TelemetryTelemetryMetricsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  @media(min-width: 640px) { grid-template-columns: repeat(2, 1fr); }
  @media(min-width: 1024px) { grid-template-columns: repeat(3, 1fr); gap: 24px; }
`;

const TelemetryCard = styled.div`
  background-color: ${Colors.adminCard};
  border: 1px solid ${Colors.border};
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  .card-top { display: flex; align-items: center; gap: 10px; }
  .card-title { font-size: 10px; font-weight: 800; color: ${Colors.textSecondary}; letter-spacing: 0.5px; }
  h3 { font-size: 28px; font-weight: 800; margin: 0; color: ${Colors.textPrimary}; }
  .sub-meta { font-size: 11px; color: ${Colors.textSecondary}; margin: 0; font-weight: 500; }
  @media(min-width: 768px) {
    padding: 24px;
    h3 { font-size: 32px; }
    .card-title { font-size: 11px; }
  }
`;

const AdaptiveListContainer = styled.div`
  width: 100%;
`;

const DesktopTableWrapper = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background-color: ${Colors.adminCard};
  border: 1px solid ${Colors.border};
  border-radius: 16px;
  overflow: hidden;
  display: none;

  th { background-color: rgba(15, 23, 42, 0.4); padding: 14px 20px; text-align: left; font-size: 11px; font-weight: 800; color: ${Colors.textSecondary}; border-bottom: 1px solid ${Colors.border}; letter-spacing: 0.5px; }
  td { padding: 14px 20px; font-size: 14px; color: ${Colors.textPrimary}; border-bottom: 1px solid rgba(51, 65, 85, 0.5); }
  tr:last-child td { border-bottom: none; }
  .monospace { font-family: monospace; font-size: 12px; color: ${Colors.textSecondary}; }
  .bold { font-weight: 700; }
  .email-row { color: ${Colors.primary}; font-weight: 600; }

  @media(min-width: 768px) {
    display: table;
  }
`;

const MobileCardsStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  @media(min-width: 768px) { display: none; }
`;

const DataMobileCard = styled.div`
  background-color: ${Colors.adminCard};
  border: 1px solid ${Colors.border};
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;

  .card-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; color: ${Colors.textPrimary}; }
  strong { color: ${Colors.textSecondary}; font-weight: 600; }
  .monospace-id { font-family: monospace; font-size: 11px; color: ${Colors.textSecondary}; word-break: break-all; }
`;

const MembersBadgeCounter = styled.div`
  background-color: ${Colors.primaryLight};
  color: ${Colors.primary};
  display: inline-flex;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 6px;
`;

const InteractiveFormCard = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  border-radius: 20px;
`;

const SubmitButton = styled(LoginButtonAction)``;