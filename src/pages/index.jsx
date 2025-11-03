import Layout from "./Layout.jsx";

import PointOfSale from "./PointOfSale";

import BackOffice from "./BackOffice";

import AIIntelligence from "./AIIntelligence";

import MobileFueling from "./MobileFueling";

import MobileScan from "./MobileScan";

import EnrollmentPage from "./EnrollmentPage";

import CapacitorSetup from "./CapacitorSetup";

import VendorPortal from "./VendorPortal";

import VendorManagementPortal from "./VendorManagementPortal";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    PointOfSale: PointOfSale,
    
    BackOffice: BackOffice,
    
    AIIntelligence: AIIntelligence,
    
    MobileFueling: MobileFueling,
    
    MobileScan: MobileScan,
    
    EnrollmentPage: EnrollmentPage,
    
    CapacitorSetup: CapacitorSetup,
    
    VendorPortal: VendorPortal,
    
    VendorManagementPortal: VendorManagementPortal,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<PointOfSale />} />
                
                
                <Route path="/PointOfSale" element={<PointOfSale />} />
                
                <Route path="/BackOffice" element={<BackOffice />} />
                
                <Route path="/AIIntelligence" element={<AIIntelligence />} />
                
                <Route path="/MobileFueling" element={<MobileFueling />} />
                
                <Route path="/MobileScan" element={<MobileScan />} />
                
                <Route path="/EnrollmentPage" element={<EnrollmentPage />} />
                
                <Route path="/CapacitorSetup" element={<CapacitorSetup />} />
                
                <Route path="/VendorPortal" element={<VendorPortal />} />
                
                <Route path="/VendorManagementPortal" element={<VendorManagementPortal />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}