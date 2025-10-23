# Bus Ticket Booking Portal

### Project Idea Summary

This project is a learning project I built to explore the requirements and functionality of a bus ticket booking platform. It includes multiple API sections, such as /admins, which contains all admin-related APIs, /users, which handles user and authentication APIs, /bookings, which covers all the bus seats bookings APIs. For more detailed information refer to the Postman API documentation.

### Tech Stack Summary

This project runs on the latest versions of these listed dependency and their versions listed in the project's `package.json` file.

- **Package Manager:** Yarn
- **Backend:** TypeScript, NestJs
- **Database:** PrismaORM, PostgreSQL
- **Cloud Storage:** Cloudinary
- **Data Validation:** Zod
- **Email Sender:** Nodemailer
- **PDF Builder:** PDFKit
- **Encoding & Decoding:** Argon
- **Authentication:** Session based JWT

### How to Use

#### 1. Clone the Repository

```bash
git clone https://github.com/nia3zzz/bus-ticket-booking-portal
cd bus-ticket-booking-portal
```

#### 2. Install Dependencies

```bash
yarn install
```

#### 3. Set Up ENV Variables

- Copy all the variables from the `.env.sample`, paste them in `.env` file after creating one and supply all the required information.

#### 4. Set Up PrismaORM

- After providing database credentials run the following command:

```bash
npx prisma migrate dev
```

#### 5. Run the Project

```bash
yarn run start:dev
```

### Documentation

As a reference guide for the project I had built some documentation for the project which is included in this README file.

#### System Designs

- This is an Eraser-based system design, more specifically a database ORM visualizer that I built and used to reference other tables and columns. The link is given below:

- https://app.eraser.io/workspace/okyBDOdvKSNHmZzVCJAg?origin=share

#### Postman API Documentation

- The prototyping, testing and documentation of all the APIs in this project were done by me in Postman. This documentation will include the request format and expected response, with all possible error responses explained. The link is given below:

- https://soontobeadded.com
