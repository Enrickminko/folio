<?php
$host = "localhost";
$user = "root";       
$pass = "";          
$db   = "folio_schneider";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Erreur de connexion : " . $conn->connect_error);
}

$nom     = $_POST['nom'] ?? '';
$email   = $_POST['email'] ?? '';
$message = $_POST['message'] ?? '';

$nom     = htmlspecialchars($nom, ENT_QUOTES);
$email   = htmlspecialchars($email, ENT_QUOTES);
$message = htmlspecialchars($message, ENT_QUOTES);

if (!empty($nom) && !empty($email) && !empty($message)) {
    $stmt = $conn->prepare("INSERT INTO contact_messages (nom, email, message) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $nom, $email, $message);
    if ($stmt->execute()) {
        echo "✅ Merci $nom, votre message a bien été envoyé.";
    } else {
        echo "❌ Erreur lors de l'envoi : " . $stmt->error;
    }
    $stmt->close();
} else {
    echo "⚠️ Veuillez remplir tous les champs.";
}

$conn->close();
?>
