import * as api from "../src/index.mjs";
import { createFakeProvider } from "../src/jev.mjs";
import { reviewPortfolio, parsePortfolioCsv, type PortfolioReport } from "../src/portfolio.mjs";
const portfolio: Promise<PortfolioReport> = reviewPortfolio({ activities: [], entries: [] });
void portfolio; void parsePortfolioCsv;
void api; void createFakeProvider;
