extends CharacterBody3D

signal defeated

@export var health := 70
@export var move_speed := 2.0
var target: Node3D
var attack_timer := 0.0

func _ready() -> void:
    add_to_group("zombies")
    _build_zombie()

func _build_zombie() -> void:
    var collider := CollisionShape3D.new()
    var capsule := CapsuleShape3D.new()
    capsule.radius = 0.43
    capsule.height = 1.65
    collider.shape = capsule
    collider.position.y = 0.82
    add_child(collider)

    var body := MeshInstance3D.new()
    var mesh := CapsuleMesh.new()
    mesh.radius = 0.43
    mesh.height = 1.65
    body.mesh = mesh
    body.position.y = 0.82
    var material := StandardMaterial3D.new()
    material.albedo_color = Color(0.28, 0.38, 0.22)
    material.roughness = 0.95
    body.material_override = material
    add_child(body)

    var head := MeshInstance3D.new()
    var head_mesh := SphereMesh.new()
    head_mesh.radius = 0.27
    head_mesh.height = 0.54
    head.mesh = head_mesh
    head.position = Vector3(0, 1.7, 0)
    var head_material := StandardMaterial3D.new()
    head_material.albedo_color = Color(0.42, 0.48, 0.31)
    head.material_override = head_material
    add_child(head)

func _physics_process(delta: float) -> void:
    attack_timer = maxf(0.0, attack_timer - delta)
    if not is_instance_valid(target):
        return
    var offset := target.global_position - global_position
    offset.y = 0.0
    var distance := offset.length()
    if distance > 1.25:
        var direction := offset.normalized()
        velocity.x = direction.x * move_speed
        velocity.z = direction.z * move_speed
        rotation.y = atan2(-direction.x, -direction.z)
    else:
        velocity.x = 0.0
        velocity.z = 0.0
        if attack_timer <= 0.0 and target.has_method("take_damage"):
            target.take_damage(8)
            attack_timer = 1.3
    velocity.y -= 22.0 * delta
    move_and_slide()

func take_damage(amount: int) -> void:
    health -= amount
    if health <= 0:
        defeated.emit()
        queue_free()
