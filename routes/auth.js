const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");


// =======================
// LOGIN
// =======================

router.post("/login", async (req, res) => {

  const { email, password, role } = req.body;

  try {

    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Email, mot de passe et rôle obligatoires"
      });
    }


    const result = await pool.query(
      "SELECT * FROM utilisateurs WHERE email = $1 AND role = $2",
      [email, role]
    );


    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Email ou rôle incorrect"
      });
    }


    const user = result.rows[0];


    const valid = await bcrypt.compare(
      password,
      user.password
    );


    if (!valid) {
      return res.status(401).json({
        message: "Mot de passe incorrect"
      });
    }


    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        nom: user.nom,
        eleve_id: user.eleve_id
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );


    res.json({

      token,

      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        telephone: user.telephone,
        eleve_id: user.eleve_id
      }

    });


  } catch (err) {

    res.status(500).json({
      message: "Erreur serveur",
      error: err.message
    });

  }

});




// =======================
// REGISTER
// =======================

router.post("/register", async (req, res) => {


  console.log("BODY RECU :", req.body);


  const {
    nom,
    email,
    password,
    role,
    telephone,
    nom_enfant,
    classe_enfant
  } = req.body;

  console.log("PASSWORD :", password);



  try {


    if (!nom || !email || !password) {

      return res.status(400).json({

        message:
        "Nom, email et mot de passe sont obligatoires"

      });

    }



    // Liaison parent / élève

    let eleve_id = null;


    if (
      role === "parent" &&
      nom_enfant &&
      classe_enfant
    ) {


      const eleveResult = await pool.query(

        "SELECT id FROM eleves WHERE LOWER(nom) LIKE LOWER($1) AND classe = $2",

        [
          `%${nom_enfant}%`,
          classe_enfant
        ]

      );


      if (eleveResult.rows.length > 0) {

        eleve_id = eleveResult.rows[0].id;

      } else {

        return res.status(404).json({

          message:
          "Enfant introuvable"

        });

      }

    }




    // Vérifier email existant

    const emailExist = await pool.query(

      "SELECT id FROM utilisateurs WHERE email = $1",

      [email]

    );


    if (emailExist.rows.length > 0) {

      return res.status(409).json({

        message:
        "Cet email est déjà utilisé."

      });

    }




    // Cryptage mot de passe

    const hash = await bcrypt.hash(

      password,

      10

    );




    // Création utilisateur

    const result = await pool.query(

      `
      INSERT INTO utilisateurs
      (nom, email, password, role, telephone, eleve_id)

      VALUES
      ($1,$2,$3,$4,$5,$6)

      RETURNING *
      `,

      [
        nom,
        email,
        hash,
        role || "parent",
        telephone || "",
        eleve_id
      ]

    );





    // Mise à jour élève

    if (eleve_id) {


      await pool.query(

        `
        UPDATE eleves
        SET parent = $1,
            telephone = $2
        WHERE id = $3
        `,

        [
          nom,
          telephone || "",
          eleve_id
        ]

      );

    }





    res.status(201).json({

      message:
      "Compte créé avec succès",


      user: {

        id: result.rows[0].id,

        nom: result.rows[0].nom,

        email: result.rows[0].email,

        role: result.rows[0].role,

        eleve_id:
        result.rows[0].eleve_id

      }

    });




  } catch (err) {


    res.status(500).json({

      message:
      "Erreur serveur",

      error:
      err.message

    });


  }


});




// =======================
// CLASSES
// =======================

router.get("/classes", async (req, res) => {


  try {


    const result = await pool.query(

      "SELECT DISTINCT classe FROM eleves ORDER BY classe ASC"

    );


    res.json(

      result.rows.map(r => r.classe)

    );


  } catch (err) {


    res.status(500).json({

      message:
      "Erreur serveur",

      error:
      err.message

    });


  }


});



module.exports = router;