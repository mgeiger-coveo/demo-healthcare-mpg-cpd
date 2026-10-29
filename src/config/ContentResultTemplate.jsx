import { ResultsImageField } from "./SearchConfig";
import { Theme } from "./theme";

const MyResultTemplateForYouTubeVideos = ({ result }) => {
  return (
    <>
      <style>{myStyles}</style>
      <atomic-result-section-badges>
        <atomic-field-condition must-match-is-recommendation="true">
          <atomic-result-badge label="Recommended"></atomic-result-badge>
        </atomic-field-condition>
        <atomic-field-condition must-match-is-top-result="true">
          <atomic-result-badge label="Top Result"></atomic-result-badge>
        </atomic-field-condition>
      </atomic-result-section-badges>

      <atomic-result-section-actions class="date-text">
        <atomic-result-date></atomic-result-date>
      </atomic-result-section-actions>

      <atomic-result-section-visual image-size="large" class="yt-thumbnail">
        <atomic-result-image field="ytthumbnailurl"></atomic-result-image>
      </atomic-result-section-visual>

      <atomic-result-section-title>
        <atomic-result-link></atomic-result-link>
      </atomic-result-section-title>

      <atomic-result-section-excerpt>
        <atomic-result-text field="excerpt"></atomic-result-text>
      </atomic-result-section-excerpt>
    </>
  );
};

const MyDefaultTemplate = ({ result, quickviewObj }) => {
  const filetype = result.raw.filetype || "Unknown";
  return (
    <>
      <style>{myStyles}</style>
      <atomic-result-section-badges>
        <atomic-field-condition must-match-is-featured="true">
          <atomic-result-badge label="Featured" />
        </atomic-field-condition>
        <atomic-field-condition must-match-is-top-result="true">
          <atomic-result-badge label="Top Result" />
        </atomic-field-condition>
      </atomic-result-section-badges>
      <atomic-result-section-title>
        <div style={{ display: "flex", alignItems: "center" }}>
          <atomic-result-link>
            <a
              slot="attributes"
              target="_blank"
              download
              href={result.clickuri}
            ></a>
          </atomic-result-link>
          <span style={{ lineHeight: "0px", marginLeft: "10px" }}>
            <atomic-quickview sandbox="allow-top-navigation allow-same-origin"></atomic-quickview>
          </span>
        </div>
      </atomic-result-section-title>
      <atomic-result-section-visual image-size={"icon"}>
        <img src={`../public/assets/${filetype}.svg`} alt="" width={"27px"} />
      </atomic-result-section-visual>
      <atomic-result-section-excerpt>
        <atomic-result-text field="excerpt"></atomic-result-text>
      </atomic-result-section-excerpt>
      <atomic-result-section-bottom-metadata>
        <atomic-result-fields-list>
          <atomic-field-condition class="field" if-defined="author">
            <span className="field-label">
              <atomic-text value="author"></atomic-text>:
            </span>
            <atomic-result-text field="author"></atomic-result-text>
          </atomic-field-condition>

          <atomic-field-condition class="field" if-defined="source">
            <span className="field-label">
              <atomic-text value="source"></atomic-text>:
            </span>
            <atomic-result-text field="source"></atomic-result-text>
          </atomic-field-condition>

          <atomic-field-condition class="field" if-defined="language">
            <span className="field-label">
              <atomic-text value="language"></atomic-text>:
            </span>
            <atomic-result-multi-value-text field="language"></atomic-result-multi-value-text>
          </atomic-field-condition>

          <atomic-field-condition class="field" if-defined="filetype">
            <span className="field-label">
              <atomic-text value="fileType"></atomic-text>:
            </span>
            <atomic-result-text field="filetype"></atomic-result-text>
          </atomic-field-condition>

          <span className="field">
            <span className="field-label">Date:</span>
            <atomic-result-date></atomic-result-date>
          </span>
        </atomic-result-fields-list>
      </atomic-result-section-bottom-metadata>
    </>
  );
};
const CommerceTemplate = ({ result, quickviewObj }) => {
  /*Update the price field here. Currently set to ec_price"*/
  const priceField = "ec_price";
  return (
    <>
      <style>{commerceStyles}</style>
      <atomic-result-section-badges>
        <div style={{ height: "30px", width: "100px" }}>
          <atomic-field-condition must-match-is-featured="true">
            <atomic-result-badge label="Featured" />
          </atomic-field-condition>
          <atomic-field-condition must-match-is-top-result="true">
            <atomic-result-badge label="Top Results" />
          </atomic-field-condition>
        </div>
      </atomic-result-section-badges>

      <atomic-result-section-visual image-size="large" class="product-image">
        <atomic-result-image field={ResultsImageField}></atomic-result-image>
      </atomic-result-section-visual>

      <atomic-result-section-title class="title">
        <atomic-result-link></atomic-result-link>
      </atomic-result-section-title>
      <atomic-result-section-bottom-metadata>
        {/* Remove the line below to remove the price tag */}
        <p className="price">
          {result.raw[priceField] ? result.raw[priceField] : " "}
        </p>
        <button className="addtocart-button">Add to Cart</button>
      </atomic-result-section-bottom-metadata>
    </>
  );
};
const MyResultTemplateFunction = (result, quickviewObj, setDisplayStyle) => {
  const regexPattern = /\/search\/([^/#\s]+)/;

  const matches = window.location.href.match(regexPattern);
  let tab = null;
  if (matches) {
    const extractedString = matches[1];
    tab = extractedString;
  }

  /* select result template by tab example*/
  /*if(tab === encodeCustomSearchTab("SharePoint")) {
      setDisplayStyle('grid')
      return <MyResultTemplateForYouTubeVideos result={result} quickviewObj={quickviewObj} />;
 } */

  setDisplayStyle("list");
  if (result.raw.filetype === "YouTubeVideo") {
    return <MyResultTemplateForYouTubeVideos result={result} />;
  }
  if (result.raw.objecttype === "Product") {
    setDisplayStyle("grid");
    return <CommerceTemplate result={result} quickviewObj={quickviewObj} />;
  }
  return <MyDefaultTemplate result={result} quickviewObj={quickviewObj} />;
};

export default MyResultTemplateFunction;

const myStyles = `
.field {
  display: flex;
  white-space: nowrap;
  align-items: center;
}

.field-label {
  font-weight: 500;
  padding-bottom : 3px;
  margin-right: 0.25rem;
}

.metadata{
  display : flex;
  width : 300px;
}

atomic-result-image{
  width : 200px;
  margin-right : 20px
}



.yt-thumbnail{
  width : 200px !important;
  height : 100px !important;
}

`;

const commerceStyles = `

atomic-result-image{
  width : 200px;
  margin-right : 20px
}
.product-image{
  width : auto !important;
  height : 300px !important;
  grid-column-start: span 2 !important;
}

price {
 display: block;
 width : 50px;
 min-width : 50px;
 padding-right: 50px;
}  
atomic-result-section-visual{
  width : 300px;
  height : 300px
}

.addtocart-button{
  width: 200px;
  height : 50px;
  margin-left: 40px
  padding-left: 40px
  margin-top : 10px;
  background : ${Theme.button};
  color : ${Theme.buttonText};
  border-radius : 6px;
  display: block;
}


`;
