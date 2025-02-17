import Application from "../models/application.model.js";
import Job from "../models/job.model.js";
import User from "../models/user.model.js";

/**
 * Fetch all applications.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const fetchApplications = async (req, res) => {
	try {
		//
		const user = req.user._id;
		const applications = await Application.find({ user });
		//
		res.status(200).json(applications);
	} catch (error) {
		console.error(
			`GET all applications Controller Error: ${error.message}`
		);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

/**
 * Fetch a single application by ID.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const fetchApplication = async (req, res) => {
	try {
		//
		const user = req.user._id;
		//
		const { id } = req.params;
		const application = await Application.findOne({ _id: id, user });
		if (!application) {
			return res.status(404).json({ error: "Application not found" });
		}
		res.status(200).json(application);
	} catch (error) {
		if (error.name === "CastError")
			return res.status(400).json({ error: "Invalid Application ID" });
		console.error(
			`GET application by id Controller Error: ${error.message}`
		);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

/**
 * Create a new application.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const createApplication = async (req, res) => {
	try {
		//
		const user = req.user._id;
		//
		const { job_id, resume, coverLetter } = req.body;

		// Validate request data
		if (!job_id || !resume) {
			return res.status(400).json({ error: "All fields are required" });
		}

		const job = await Job.findById(job_id);
		if (!job) {
			return res.status(400).json({ error: "Job Not Found" });
		}

		// No two applications on same listing for the same user
		const existingApplication = await Application.findOne({ user, job });
		if (existingApplication)
			return res
				.status(400)
				.json({ error: "User's Application Exists For Listing" });

		const newApplication = new Application({
			user,
			job,
			resume,
			coverLetter,
		});

		await newApplication.save();

		await User.updateOne(
			{ _id: user },
			{ $push: { applications: newApplication._id } }
		);
		await Job.updateOne(
			{ _id: job_id },
			{ $push: { applications: newApplication._id } }
		);

		res.status(201).json(newApplication);
	} catch (error) {
		if (error.name === "ValidationError")
			return res
				.status(400)
				.json({ error: error.message.split(":")[2].trim() });
		if (error.name === "CastError")
			return res.status(400).json({ error: "Invalid Job or User ID" });
		console.error(`Post Applications Controller Error: ${error.message}`);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

/**
 * Update an existing application.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const updateApplication = async (req, res) => {
	try {
		const { id } = req.params;
		//
		const user = req.user._id;
		//
		const { resume, coverLetter /*, job_id **/ } = req.body;

		// Validate request data
		if (/*!job_id || */ !resume) {
			return res.status(400).json({ error: "All fields are required" });
		}

		const application = await Application.findById(id);
		if (!application)
			return res.status(404).json({ error: "Application Not Found" });
		// Validate request data

		// const job = await Job.findById(job_id);
		// if (!job) {
		//   return res.status(400).json({ error: "Job Not Found" });
		// }

		//Check if current user owns the application
		if (String(application.user) !== String(user))
			return res.sendStatus(403);

		application.resume = resume;
		application.coverLetter = coverLetter;
		// application.job = job_id
		await application.save();

		res.status(200).json(application);
	} catch (error) {
		if (error.name === "ValidationError")
			return res
				.status(400)
				.json({ error: error.message.split(":")[2].trim() });
		if (error.name === "CastError")
			return res.status(400).json({ error: "Invalid Application ID" });
		console.error(`Update Application Controller Error: ${error.message}`);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

/**
 * Delete an application by ID.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const deleteApplication = async (req, res) => {
	try {
		const { id } = req.params;
		const user = req.user._id;
		const application = await Application.findOne({ _id: id });
		if (!application)
			return res.status(400).json({ error: "Application Not Found" });

		//Check if user owns application
		if (String(application.user) !== String(user))
			return res.sendStatus(403);

		const result = await application.deleteOne();
		return res
			.status(204)
			.json({ success: "Successfully Deleted Application" });
	} catch (error) {
		if (error.name === "CastError")
			return res.status(400).json({ error: "Invalid Application ID" });
		console.error(`Delete Applications Controller Error: ${error.message}`);
		res.status(500).json({ error: "Internal Server Error" });
	}
};
