<?php
$conn = new mysqli("localhost", "root", "", "folio_schneider");
$result = $conn->query("SELECT * FROM contact_messages ORDER BY date_envoi DESC");
?>

<h2>📥 Messages reçus</h2>
<table border="1" cellpadding="10">
  <tr><th>Nom</th><th>Email</th><th>Message</th><th>Date</th></tr>
  <?php while($row = $result->fetch_assoc()): ?>
    <tr>
      <td><?= htmlspecialchars($row['nom']) ?></td>
      <td><?= htmlspecialchars($row['email']) ?></td>
      <td><?= nl2br(htmlspecialchars($row['message'])) ?></td>
      <td><?= $row['date_envoi'] ?></td>
    </tr>
  <?php endwhile; ?>
</table>

<?php $conn->close(); ?>
