import { Box } from "@mui/material";
import React from "react";

const stylesheet = `
    
  .grid-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  .grid-item {
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    padding: 20px;
  }
  h1{
    margin: 10px 0px;
  }
  h2 {
    color: #333;
    font-size: 18px;
    margin-top: 0;
    margin-bottom: 10px;
  }
  a {
    color: #0275d8;
    text-decoration: none;
    line-height: 1.6;
  }
  a:hover {
    text-decoration: underline;
  }

`;

const DocsPage: React.FC = () => {
  return (
    <Box p={10}>
      <style>{stylesheet}</style>
      <div>
        <h1>Coveo Documentation Full Catalog</h1>
        <div className="grid-container">
          {/* <!-- Coveo Overview --> */}
          <div className="grid-item">
            <h2>Coveo Overview</h2>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/3361/coveo-overview">
                Coveo Overview
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://www.coveo.com/en/solutions/digital-workplace">
                Digital Workplace Solutions
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://www.coveo.com/en/platform/technology">
                Coveo Platform Technology
              </a>
            </li>
          </div>

          {/* <!-- Index Content --> */}
          <div className="grid-item">
            <h2>Index Content</h2>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/3370/index-content/index-content">
                Index Content Overview
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/1689/index-content/supported-file-formats">
                Supported File Formats
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/1702/index-content/connector-directory">
                Connector Directory
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/29/index-content/manage-the-mapping-configuration-of-a-source">
                Manage the Mapping Configuration of a Source
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/1719/index-content/management-of-security-identities-and-item-permissions">
                Management of Security Identities and Item Permissions
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/1556/index-content/indexing-pipeline-extension-overview">
                Indexing Pipeline Extension Overview
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/1833/index-content/manage-fields">
                Manage Fields
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/2036/index-content/about-fields">
                About Fields
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/1640/index-content/manage-source-mappings">
                Manage Source Mappings
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/1982/index-content/add-or-edit-a-field#advanced-settings">
                Add or Edit a Field - Advanced Settings
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/1967/index-content/add-or-edit-a-sitemap-source">
                Add or Edit a Sitemap Source
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/1965/index-content/source-item-types">
                Source Item Types
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/1637/index-content/add-or-edit-a-youtube-source">
                Add or Edit a YouTube Source
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/2039/index-content/refresh-rescan-and-rebuild">
                Refresh, Rescan, and Rebuild
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/1905/index-content/manage-security-identities">
                Manage Security Identities
              </a>
            </li>
          </div>

          {/* <!-- Leverage Machine Learning --> */}
          <div className="grid-item">
            <h2>Leverage Machine Learning</h2>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/n9de0370/leverage-machine-learning/about-relevance-generative-answering-rga">
                About Relevance Generative Answering (RGA)
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/3389/leverage-machine-learning/about-custom-context">
                About Custom Context
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/3384/leverage-machine-learning/about-automatic-relevance-tuning-art">
                About Automatic Relevance Tuning (ART)
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/2081/leverage-machine-learning/custom-context">
                Custom Context
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/nb6a0390/leverage-machine-learning/relevance-generative-answering-rga-implementation-overview">
                RGA Implementation Overview
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/3386/leverage-machine-learning/about-query-suggestions-qs">
                About Query Suggestions (QS)
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/3387/leverage-machine-learning/about-content-recommendations-cr">
                About Content Recommendations (CR)
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/1727/leverage-machine-learning/overview">
                Overview of Machine Learning Capabilities
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/m5vg6516/coveo-for-commerce/about-intent-aware-product-ranking-iapr">
                About Intent-Aware Product Ranking (IAPR)
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/lcee0589/coveo-for-commerce/about-predictive-query-suggestions-pqs">
                About Predictive Query Suggestions (PQS)
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/nab90474/coveo-for-commerce/user-session-vectors">
                User Session Vectors
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/na2a8306/coveo-for-commerce/about-the-cold-start-model">
                About the Cold Start Model
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/nb6a0210/leverage-machine-learning/relevance-generative-answering-rga-reports-and-ua-events">
                RGA Reports and UA Events
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/3383/leverage-machine-learning/about-dynamic-navigation-experience-dne">
                About Dynamic Navigation Experience (DNE)
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/3297/leverage-machine-learning/about-user-stitching">
                About User Stitching
              </a>
            </li>
          </div>

          {/* <!-- Tune Relevance --> */}
          <div className="grid-item">
            <h2>Tune Relevance</h2>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/3405/tune-relevance/manage-thesaurus-rules">
                Manage Thesaurus Rules
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/1611/tune-relevance/what-s-a-query-pipeline">
                What's a Query Pipeline?
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/3371/tune-relevance/tune-relevance">
                Tune Relevance
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/3410/tune-relevance/manage-filter-rules">
                Manage Filter Rules
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/3234/tune-relevance/manage-result-ranking-rules">
                Manage Result Ranking Rules
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/3255/tune-relevance/manage-a-b-tests">
                Manage A/B Tests
              </a>
            </li>
          </div>

          {/* <!-- Searching with Coveo --> */}
          <div className="grid-item">
            <h2>Searching with Coveo</h2>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/1810/searching-with-coveo/query-correction-feature">
                Query Correction Feature
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/1624/searching-with-coveo/about-search-result-ranking">
                About Search Result Ranking
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/1571/searching-with-coveo/using-facets">
                Using Facets
              </a>
            </li>
          </div>

          {/* <!-- Build a Search UI --> */}
          <div className="grid-item">
            <h2>Build a Search UI</h2>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/3368/build-a-search-ui/choose-the-right-approach">
                Choose the Right Approach
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/atomic/latest/reference/result-template-components/atomic-quickview/">
                Atomic Quickview
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/atomic/latest/reference/components/atomic-search-box-recent-queries/">
                Atomic Search Box Recent Queries
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/atomic/latest/reference/components/atomic-sort-dropdown/">
                Atomic Sort Dropdown
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/headless/latest/">
                Headless Library
              </a>
            </li>
          </div>

          {/* <!-- Analyze Usage Data --> */}
          <div className="grid-item">
            <h2>Analyze Usage Data</h2>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/3373/analyze-usage-data/analyze-usage-data">
                Analyze Usage Data
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/1856/analyze-usage-data/manage-raw-data">
                Manage Raw Data
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/1964/analyze-usage-data/review-user-visits-with-the-visit-browser">
                Review User Visits with the Visit Browser
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/1670/analyze-usage-data/concepts">
                Concepts
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/1904/analyze-usage-data/dimensions">
                Dimensions
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/2949/analyze-usage-data/events">
                Events
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/1559/analyze-usage-data/review-trends-from-the-summary-dashboard">
                Review Trends from the Summary Dashboard
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/l3bf0598/analyze-usage-data/overview">
                Overview
              </a>
            </li>
          </div>

          {/* <!-- Manage an Organization --> */}
          <div className="grid-item">
            <h2>Manage an Organization</h2>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/2976/manage-an-organization/deployment-regions-and-strategies">
                Deployment Regions and Strategies
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/1841/manage-an-organization/about-the-administration-console">
                About the Administration Console
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/n7ef0517/manage-an-organization/manage-projects">
                Manage Projects
              </a>
            </li>
          </div>

          {/* <!-- Security and Compliance --> */}
          <div className="grid-item">
            <h2>Security and Compliance</h2>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/1778/security/coveo-security">
                Coveo Security
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/2794/security/compliance">
                Compliance
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/1663/security/data-and-security">
                Data and Security
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/1663/security/data-and-security#data-encryption">
                Data Encryption
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/1663/security/data-and-security#network-isolation">
                Network Isolation
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/1663/security/data-and-security#access-controls">
                Access Controls
              </a>
            </li>
          </div>

          {/* <!-- Coveo Services --> */}
          <div className="grid-item">
            <h2>Coveo Services</h2>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/1484/coveo-services/customer-support-and-success-plans">
                Customer Support and Success Plans
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/2752/coveo-services/ideas-methodology">
                IDEAS Methodology
              </a>
            </li>
          </div>

          {/* <!-- Coveo for Commerce --> */}
          <div className="grid-item">
            <h2>Coveo for Commerce</h2>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/m5vg6516/coveo-for-commerce/about-intent-aware-product-ranking-iapr">
                About Intent-Aware Product Ranking (IAPR)
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/3448/coveo-for-commerce/gather-data-and-integrate-your-catalog">
                Gather Data and Integrate Your Catalog
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/n73f0502/coveo-for-commerce/commerce-fields">
                Commerce Fields
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/n8of5561/coveo-for-commerce/catalog-objects">
                Catalog Objects
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/m5vg6516/coveo-for-commerce/about-intent-aware-product-ranking-iapr#how-do-iapr-models-leverage-product-and-user-session-vectors">
                How Do IAPR Models Leverage Product and User Session Vectors
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/m5rd0471/coveo-for-commerce/about-session-based-product-recommendations-sbpr">
                About Session-Based Product Recommendations (SBPR)
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/2775/coveo-for-commerce/external-search-engine-optimization-seo">
                External Search Engine Optimization (SEO)
              </a>
            </li>
          </div>

          {/* <!-- APIs and Development Tools --> */}
          <div className="grid-item">
            <h2>APIs and Development Tools</h2>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/143/apis/overview">
                APIs Overview
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/cli/">CLI</a>
            </li>
          </div>

          {/* <!-- Coveo Platform and Technology Insights --> */}
          <div className="grid-item">
            <h2>Coveo Platform and Technology Insights</h2>
            <li className="list-group-item">
              <a href="https://docs.coveo.com/en/3132/glossary/product-recommendations">
                Product Recommendations Glossary
              </a>
            </li>
          </div>

          {/* <!-- Community and Training --> */}
          <div className="grid-item">
            <h2>Community and Training</h2>
            <li className="list-group-item">
              <a href="https://www.coveo.com/en/company/esg">
                Community Contributions (ESG)
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://connect.coveo.com/s/">Coveo Connect</a>
            </li>
            <li className="list-group-item">
              <a href="https://www.coveo.com/en/services/training">
                Training Services
              </a>
            </li>
            <li className="list-group-item">
              <a href="https://levelup.coveo.com/welcome">LevelUp</a>
            </li>
          </div>
        </div>
      </div>
    </Box>
  );
};

export default DocsPage;
