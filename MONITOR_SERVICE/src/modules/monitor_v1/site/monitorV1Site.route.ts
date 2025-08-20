import { Router } from "express";
import { Wrapper } from "../../../utils/base.utils";
import { MonitorController } from "./monitorV1Site.controller";
const monitorV1SiteRouter = Router();

/**
 * @swagger
 * /monitor/v1/sites/:
 *   post:
 *     summary: Register a new site and it's endpoints for monitoring
 *     description: Registers a new site it's endpoints for monitoring . If the site is already registered, it returns an error.If you
 *     tags: [Monitor V1 Sites]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterSiteMonitorDto'
 *     responses:
 *       200:
 *         description: Monitoring routes registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Monitoring routes registered successfully
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: This URL is already registered for monitoring, please edit the existing site instead of creating a new one
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Internal server error
 */
monitorV1SiteRouter.post("/", Wrapper(MonitorController.registerSiteMonitor.bind(MonitorController)));

/**
 * @swagger
 * /monitor/v1/sites/:
 *   get:
 *     summary: Get monitoring sites and their APIs
 *     description: |
 *       This endpoint returns monitoring site(s) and their API(s) based on the query parameters provided.
 *       The response shape varies depending on the combination of `siteId` and `siteApiId`:
 *
 *       1. **No `siteId` or `siteApiId` provided** → Returns a paginated list of all monitoring sites.
 *       2. **Only `siteApiId` provided** → Returns details of a single API along with its parent site info.
 *       3. **Only `siteId` provided** → Returns details of a single site and a paginated list of its APIs.
 *       4. **Both `siteId` and `siteApiId` provided** → Returns a single site and the specified API belonging to it.
 *
 *       **Query parameters:**
 *       - `siteId` (string): Fetch a specific site and its APIs.
 *       - `siteApiId` (string): Fetch a specific API and its site info.
 *       - `page`, `limit` (integers): Pagination for lists or APIs.
 *       - `isActive` (boolean): Filter by active status (optional).
 *       - `priority` (integer, 1-4): Filter APIs by priority (optional).
 *       - `order` (string, ASC|DESC): Sort order, default is DESC.
 *       - `orderBy` (string, createdAt|url): Field to sort by, default is createdAt.
 *       - `search` (string): Search term to filter sites by URL, name, or endpoint (optional).
 *       - `httpMethod` (string, GET|POST|PUT|PATCH|DELETE): Filter APIs by HTTP method (optional).
 *
 *       **Example queries:**
 *       - `/monitor/v1/sites` → Paginated list of sites
 *       - `/monitor/v1/sites?siteId=abc123` → Single site with its APIs
 *       - `/monitor/v1/sites?siteApiId=api456` → Single API with its site info
 *       - `/monitor/v1/sites?siteId=abc123&siteApiId=api456` → Single site with specific API
 *
 *     tags: [Monitor V1 Sites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status (optional)
 *       - in: query
 *         name: priority
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3, 4]
 *         description: Filter by API priority (optional)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 20
 *         description: Number of items per page
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [createdAt, url]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter sites by URL, name, or endpoint
 *       - in: query
 *         name: siteId
 *         schema:
 *           type: string
 *         description: Fetch a single site with its APIs (optional)
 *       - in: query
 *         name: siteApiId
 *         schema:
 *           type: string
 *         description: Fetch a single API with site info (optional)
 *       - in: query
 *         name: httpMethod
 *         schema:
 *           type: string
 *           enum: [GET, POST, PUT, PATCH, DELETE]
 *         description: HTTP method filter (optional)
 *     responses:
 *       200:
 *         description: Monitoring sites and APIs fetched successfully. Response shape depends on query parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Monitoring routes fetched successfully
 *                 data:
 *                   type: object
 */
monitorV1SiteRouter.get("/", Wrapper(MonitorController.getSites.bind(MonitorController)));

/**
 * @swagger
 * /monitor/v1/sites/{siteId}:
 *   put:
 *     summary: Update an existing monitoring site
 *     description: Updates a monitoring site's URL, name, active status, and notification settings for the authenticated user.
 *     tags: [Monitor V1 Sites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the monitoring site to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: The new URL of the site (must be unique for the user)
 *               siteNotification:
 *                 type: boolean
 *                 description: Enable or disable notifications for the site
 *               siteName:
 *                 type: string
 *                 description: The display name of the site
 *               isActive:
 *                 type: boolean
 *                 description: Whether the site monitoring is active
 *             example:
 *               url: "https://example.com"
 *               siteNotification: true
 *               siteName: "Example Site"
 *               isActive: true
 *     responses:
 *       200:
 *         description: Monitoring site updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Monitoring routes updated successfully
 *       400:
 *         description: Invalid input or missing required fields or URL conflict with another site for the same user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: Site ID is required to update monitoring routes
 *       404:
 *         description: Site not found for the authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: Site not found for this user
 *       401:
 *         description: Unauthorized request (missing or invalid token)
 */
monitorV1SiteRouter.put("/:siteId", Wrapper(MonitorController.updateSite.bind(MonitorController)));

/**
 * @swagger
 * /monitor/v1/sites/{siteId}:
 *   delete:
 *     summary: Delete a monitored site
 *     tags: [Monitor V1 Sites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Site deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Site deleted successfully
 *       400:
 *         description: Invalid input (missing siteId or userId)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: Site ID is required to delete monitoring site
 *       404:
 *         description: Site not found for this user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: Site not found for this user
 */
monitorV1SiteRouter.delete("/:siteId", Wrapper(MonitorController.deleteSite.bind(MonitorController)));

/**
 * @swagger
 * /monitor/v1/sites/{siteId}/api/{siteApiId}:
 *   put:
 *     summary: Edit an existing API of a monitored site
 *     description: Updates an existing API's details for a monitored site.
 *     tags: [Monitor V1 Sites Apis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the monitored site
 *       - in: path
 *         name: siteApiId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the API to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EditExistingSiteApiDto'
 *     responses:
 *       200:
 *         description: Site API updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Site API updated successfully
 *       400:
 *         description: Invalid input (missing siteId, siteApiId, or userId)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: Site ID and Site API ID are required to edit site API
 *       404:
 *         description: Site API not found for this site and user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: Site API not found for this site and user
 */
monitorV1SiteRouter.put("/:siteId/api/:siteApiId", Wrapper(MonitorController.editExistingSiteApi.bind(MonitorController)));

/**
 * @swagger
 * /monitor/v1/sites/{siteId}/api:
 *   post:
 *     summary: Add new APIs to a monitored site
 *     tags: [Monitor V1 Sites Apis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the monitored site to which the API will be added
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddNewSiteApiDto'
 *     responses:
 *       200:
 *         description: Site API added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Site API added successfully
 *       400:
 *         description: Invalid input (missing siteId or userId)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: Site ID is required to add site API
 *       404:
 *         description: Site not found for this user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: Site not found for this user
 *       500:
 *         description: Internal server error
 */
monitorV1SiteRouter.post("/:siteId/api", Wrapper(MonitorController.addSiteApi.bind(MonitorController)));

/**
 * @swagger
 * /monitor/v1/sites/{siteId}/api/{siteApiId}:
 *   delete:
 *     summary: Delete a specific API from a monitored site
 *     tags: [Monitor V1 Sites Apis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the monitored site
 *       - in: path
 *         name: siteApiId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the API to delete from the monitored site
 *     responses:
 *       200:
 *         description: Site API deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Site API deleted successfully
 *       400:
 *         description: Invalid input (missing siteId, siteApiId, or userId)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: Site ID and Site API ID are required to delete site API
 *       404:
 *         description: Site API not found for this site and user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: Site API not found for this site and user
 */
monitorV1SiteRouter.delete("/:siteId/api/:siteApiId", Wrapper(MonitorController.deleteSiteApi.bind(MonitorController)));

export { monitorV1SiteRouter };
